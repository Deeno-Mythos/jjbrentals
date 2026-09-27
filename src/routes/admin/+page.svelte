<script>
	import { onMount } from 'svelte';

	/** @type {import('./$types').PageData} */
	export let data;

	const rooms = [
		{ id: 'fan', name: 'Fan room', short: 'Fan' },
		{ id: 'aircon', name: 'Aircon double room', short: 'Aircon double' },
		{ id: 'aircon-bunk', name: 'Aircon bunk room', short: 'Aircon bunk' }
	];
	const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const roomNames = Object.fromEntries(rooms.map((room) => [room.id, room.name]));
	let authenticated = data.authenticated;
	let password = '';
	let loginError = '';
	let errorMessage = '';
	let loading = false;
	let updatingId = '';
	let filterRoom = 'all';
	/** @type {Array<any>} */
	let bookings = [];
	let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

	$: monthTitle = month.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
	$: calendarDays = makeCalendarDays(month);
	$: visibleBookings = bookings.filter((booking) => filterRoom === 'all' || booking.room_id === filterRoom);
	$: confirmedCount = visibleBookings.filter((booking) => booking.status === 'confirmed').length;
	$: pendingCount = visibleBookings.filter((booking) => booking.status === 'pending').length;

	/** @param {Date} date */
	function dateKey(date) {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	}

	/** @param {Date} currentMonth @returns {Date[]} */
	function makeCalendarDays(currentMonth) {
		const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
		const mondayOffset = (first.getDay() + 6) % 7;
		const start = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
		return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
	}

	/** @param {Date} day */
	function calendarBookings(day) {
		const key = dateKey(day);
		return visibleBookings.filter((booking) => booking.status !== 'cancelled' && booking.check_in <= key && booking.check_out > key);
	}

	/** @param {string} value */
	function formatDate(value) {
		return new Date(`${value}T12:00:00`).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	/** @param {number | string} value */
	function formatPeso(value) {
		return `₱${Number(value).toLocaleString('en-PH')}`;
	}

	async function refreshBookings() {
		loading = true;
		errorMessage = '';
		const from = dateKey(new Date(month.getFullYear(), month.getMonth(), 1));
		const to = dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 1));
		try {
			const response = await fetch(`/api/admin/bookings?from=${from}&to=${to}`);
			const result = await response.json();
			if (response.status === 401) {
				authenticated = false;
				bookings = [];
				return;
			}
			if (!response.ok) throw new Error(result.error || 'The calendar could not be loaded.');
			bookings = result.bookings;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'The calendar could not be loaded.';
		} finally {
			loading = false;
		}
	}

	/** @param {SubmitEvent} event */
	async function login(event) {
		event.preventDefault();
		loginError = '';
		try {
			const response = await fetch('/api/admin/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ password })
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || 'Sign-in failed.');
			authenticated = true;
			password = '';
			await refreshBookings();
		} catch (error) {
			loginError = error instanceof Error ? error.message : 'Sign-in failed.';
		}
	}

	/** @param {number} amount */
	async function changeMonth(amount) {
		month = new Date(month.getFullYear(), month.getMonth() + amount, 1);
		await refreshBookings();
	}

	/** @param {any} booking @param {'pending' | 'confirmed' | 'cancelled'} status */
	async function updateStatus(booking, status) {
		updatingId = booking.id;
		errorMessage = '';
		try {
			const response = await fetch('/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ id: booking.id, status })
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || 'The booking could not be updated.');
			await refreshBookings();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'The booking could not be updated.';
		} finally {
			updatingId = '';
		}
	}

	async function logout() {
		await fetch('/api/admin/logout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
		authenticated = false;
		bookings = [];
	}

	onMount(() => {
		if (authenticated) refreshBookings();
	});
</script>

<svelte:head>
	<title>Admin calendar | JJB Rentals</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="admin-page">
	<header class="admin-topbar">
		<a href="/" class="admin-brand"><span class="admin-brand-mark">J</span><span><strong>JJB Rentals</strong><small>ADMIN SPACE</small></span></a>
		{#if authenticated}<button class="admin-logout" onclick={logout}>Sign out</button>{/if}
	</header>

	{#if !authenticated}
		<main class="admin-login-wrap">
			<form class="admin-login-card" onsubmit={login}>
				<p class="admin-eyebrow">Private access</p>
				<h1>Welcome back.</h1>
				<p class="admin-subtitle">Sign in to manage room requests and availability.</p>
				<label>Admin password<input type="password" autocomplete="current-password" bind:value={password} required /></label>
				{#if loginError}<p class="admin-error" role="alert">{loginError}</p>{/if}
				<button class="admin-primary" type="submit">Sign in <span>↗</span></button>
				<a href="/" class="admin-back">← Back to JJB Rentals</a>
			</form>
		</main>
	{:else}
		<main class="admin-main">
			<div class="admin-page-heading"><div><p class="admin-eyebrow">Stay overview</p><h1>Availability calendar</h1><p class="admin-subtitle">Track requests and confirmed room stays in one place.</p></div><a href="/#booking" class="admin-public-link">Open booking form ↗</a></div>

			{#if errorMessage}<div class="admin-error-banner" role="alert">{errorMessage}</div>{/if}

			<div class="admin-stats">
				<div class="admin-stat"><span>Pending requests</span><strong>{pendingCount}</strong><small>Need your review</small></div>
				<div class="admin-stat"><span>Confirmed stays</span><strong>{confirmedCount}</strong><small>In the selected month</small></div>
				<div class="admin-stat"><span>Room types</span><strong>03</strong><small>One room per option</small></div>
			</div>

			<section class="admin-panel calendar-panel" aria-labelledby="calendar-title">
				<div class="calendar-toolbar">
					<div><p class="admin-eyebrow">Room availability</p><h2 id="calendar-title">{monthTitle}</h2></div>
					<div class="calendar-controls"><button aria-label="Previous month" onclick={() => changeMonth(-1)}>←</button><button class="calendar-today" onclick={() => { month = new Date(new Date().getFullYear(), new Date().getMonth(), 1); refreshBookings(); }}>Today</button><button aria-label="Next month" onclick={() => changeMonth(1)}>→</button></div>
				</div>
				<div class="calendar-filters"><label for="room-filter">Show rooms</label><select id="room-filter" bind:value={filterRoom}><option value="all">All rooms</option>{#each rooms as room}<option value={room.id}>{room.name}</option>{/each}</select><span class="calendar-legend"><i class="legend-dot pending-dot"></i>Pending <i class="legend-dot confirmed-dot"></i>Confirmed</span></div>
				<div class="calendar-grid">
					{#each weekdays as day}<div class="calendar-weekday">{day}</div>{/each}
					{#each calendarDays as day (dateKey(day))}
						<div class="calendar-day" class:outside={day.getMonth() !== month.getMonth()} class:is-today={dateKey(day) === dateKey(new Date())}>
							<span class="calendar-day-number">{day.getDate()}</span>
							<div class="calendar-day-bookings">
								{#each calendarBookings(day) as booking (booking.id)}
									<div class="calendar-booking" class:pending-booking={booking.status === 'pending'} class:confirmed-booking={booking.status === 'confirmed'} title={`${roomNames[booking.room_id]} · ${booking.guest_name} · ${booking.status}`}><span>{rooms.find((room) => room.id === booking.room_id)?.short}</span><i>{booking.status === 'pending' ? 'P' : '✓'}</i></div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
				<p class="calendar-note">Pending requests are tentative; dates are blocked only after you confirm the stay. Check-out day is available for the next guest.</p>
			</section>

			<section class="admin-panel requests-panel" aria-labelledby="requests-title">
				<div class="requests-heading"><div><p class="admin-eyebrow">Your inbox</p><h2 id="requests-title">Booking requests</h2></div><span>{visibleBookings.length} this month</span></div>
				{#if loading}<p class="admin-empty">Loading bookings…</p>
				{:else if visibleBookings.length === 0}<p class="admin-empty">No booking requests overlap this month yet.</p>
				{:else}
					<div class="booking-list">
						{#each visibleBookings as booking (booking.id)}
							<article class="booking-row">
								<div class="booking-row-main"><div class="booking-row-title"><h3>{booking.guest_name}</h3><span class="booking-status" class:status-pending={booking.status === 'pending'} class:status-confirmed={booking.status === 'confirmed'} class:status-cancelled={booking.status === 'cancelled'}>{booking.status}</span></div><p>{roomNames[booking.room_id]} · {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'} · {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</p><p class="booking-row-dates">{formatDate(booking.check_in)} <span>→</span> {formatDate(booking.check_out)} · <strong>{formatPeso(booking.total_amount)}</strong></p><div class="booking-row-contact"><a href={`tel:${booking.guest_phone}`}>{booking.guest_phone}</a>{#if booking.guest_email}<a href={`mailto:${booking.guest_email}`}>{booking.guest_email}</a>{/if}</div>{#if booking.notes}<p class="booking-notes">“{booking.notes}”</p>{/if}</div>
								<div class="booking-row-actions">{#if booking.status === 'pending'}<button class="admin-primary small-action" disabled={updatingId === booking.id} onclick={() => updateStatus(booking, 'confirmed')}>Confirm</button><button class="admin-secondary small-action" disabled={updatingId === booking.id} onclick={() => updateStatus(booking, 'cancelled')}>Decline</button>{:else if booking.status === 'confirmed'}<button class="admin-secondary small-action" disabled={updatingId === booking.id} onclick={() => updateStatus(booking, 'cancelled')}>Cancel stay</button>{:else}<button class="admin-secondary small-action" disabled={updatingId === booking.id} onclick={() => updateStatus(booking, 'pending')}>Restore request</button>{/if}</div>
							</article>
						{/each}
					</div>
				{/if}
			</section>
		</main>
	{/if}
</div>

<style>
	:global(body) { margin: 0; background: #f3f6f6; color: #28363d; font-family: 'DM Sans', sans-serif; }
	:global(button), :global(input), :global(select) { font: inherit; }
	.admin-page { min-height: 100vh; }
	.admin-topbar { height: 72px; padding: 0 clamp(20px, 5vw, 68px); background: #fff; border-bottom: 1px solid #e0e7e9; display: flex; justify-content: space-between; align-items: center; }
	.admin-brand { display: flex; align-items: center; gap: 10px; color: inherit; text-decoration: none; }
	.admin-brand-mark { width: 35px; height: 35px; display: grid; place-items: center; border-radius: 50%; background: #dce9ed; color: #385f72; font: 800 19px Manrope, sans-serif; }
	.admin-brand strong, .admin-brand small { display: block; }
	.admin-brand strong { font: 700 14px Manrope, sans-serif; }
	.admin-brand small { margin-top: 3px; color: #70818a; font-size: 8px; letter-spacing: .16em; }
	.admin-logout, .admin-public-link, .admin-back { color: #58717c; font-size: 12px; }
	.admin-logout { border: 1px solid #dce4e7; background: white; padding: 9px 14px; cursor: pointer; }
	.admin-main { width: min(100% - 40px, 1120px); margin: 0 auto; padding: 46px 0 76px; }
	.admin-page-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 25px; }
	.admin-eyebrow { margin: 0 0 9px; color: #678798; font-size: 9px; letter-spacing: .17em; text-transform: uppercase; font-weight: 700; }
	h1, h2, h3, p { margin-top: 0; }
	h1, h2 { font-family: Manrope, sans-serif; letter-spacing: -.045em; }
	h1 { margin-bottom: 8px; font-size: clamp(32px, 4vw, 46px); line-height: 1.08; }
.admin-page h1 { color: #28363d; }
	h2 { margin-bottom: 0; font-size: 24px; }
	.admin-subtitle { margin-bottom: 0; color: #71818a; font-size: 13px; line-height: 1.6; }
	.admin-public-link { text-decoration: none; padding-bottom: 4px; white-space: nowrap; }
	.admin-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; margin-bottom: 18px; }
	.admin-stat, .admin-panel, .admin-login-card { background: #fff; border: 1px solid #e0e7e9; }
	.admin-stat { min-height: 100px; padding: 17px 19px; display: grid; grid-template-columns: 1fr auto; align-content: space-between; }
	.admin-stat span { color: #71818a; font-size: 11px; }
	.admin-stat strong { grid-column: 2; grid-row: 1 / span 2; align-self: center; font: 700 32px Manrope, sans-serif; color: #365b6b; }
	.admin-stat small { color: #97a3a8; font-size: 9px; }
	.admin-panel { padding: 24px; margin-bottom: 18px; }
	.calendar-toolbar, .requests-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
	.calendar-toolbar h2 { text-transform: capitalize; }
	.calendar-controls { display: flex; gap: 7px; }
	.calendar-controls button { min-width: 37px; height: 36px; padding: 0 11px; border: 1px solid #dce5e8; background: #fff; color: #365b6b; cursor: pointer; }
	.calendar-controls .calendar-today { font-size: 11px; }
	.calendar-filters { display: flex; align-items: center; gap: 10px; margin: 19px 0 13px; color: #70818a; font-size: 10px; }
	.calendar-filters select { border: 1px solid #dce5e8; background: #fff; color: #34454d; padding: 8px 28px 8px 10px; font-size: 10px; }
	.calendar-legend { display: flex; align-items: center; gap: 6px; margin-left: auto; }
	.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
	.pending-dot { background: #d7a34e; }
	.confirmed-dot { background: #4f8294; margin-left: 8px; }
	.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border-top: 1px solid #e5ebed; border-left: 1px solid #e5ebed; }
	.calendar-weekday { min-height: 31px; display: grid; place-items: center; color: #84939a; background: #f7f9f9; border-right: 1px solid #e5ebed; border-bottom: 1px solid #e5ebed; font-size: 9px; font-weight: 700; }
	.calendar-day { min-width: 0; min-height: 91px; padding: 7px; background: #fff; border-right: 1px solid #e5ebed; border-bottom: 1px solid #e5ebed; }
	.calendar-day.outside { background: #fafbfb; }
	.calendar-day.outside .calendar-day-number { color: #bac4c8; }
	.calendar-day.is-today { box-shadow: inset 0 0 0 2px #91b4c1; }
	.calendar-day-number { width: 22px; height: 22px; display: grid; place-items: center; margin-bottom: 4px; border-radius: 50%; color: #465a64; font-size: 10px; }
	.calendar-day.is-today .calendar-day-number { background: #416b7d; color: white; }
	.calendar-day-bookings { display: grid; gap: 3px; }
	.calendar-booking { min-width: 0; display: flex; justify-content: space-between; gap: 3px; padding: 3px 4px; border-left: 2px solid; font-size: 8px; line-height: 1.25; }
	.calendar-booking span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.calendar-booking i { flex: 0 0 auto; font-style: normal; }
	.pending-booking { border-color: #d7a34e; background: #fcf5e9; color: #836332; }
	.confirmed-booking { border-color: #4f8294; background: #e9f1f3; color: #426a79; }
	.calendar-note { margin: 12px 0 0; color: #829097; font-size: 10px; line-height: 1.6; }
	.requests-heading { margin-bottom: 12px; }
	.requests-heading > span { color: #7c8a91; font-size: 10px; }
	.admin-empty { margin: 0; padding: 25px 8px 9px; color: #829097; font-size: 12px; }
	.booking-list { border-top: 1px solid #e7ecee; }
	.booking-row { display: flex; justify-content: space-between; gap: 22px; padding: 18px 0; border-bottom: 1px solid #e7ecee; }
	.booking-row:last-child { border-bottom: 0; padding-bottom: 2px; }
	.booking-row-main { min-width: 0; }
	.booking-row-title { display: flex; align-items: center; gap: 10px; }
	.booking-row-title h3 { margin-bottom: 0; font: 700 15px Manrope, sans-serif; }
	.booking-row-main > p { margin: 6px 0 0; color: #75858d; font-size: 11px; line-height: 1.5; }
	.booking-row-main .booking-row-dates { color: #4d616a; }
	.booking-row-dates span { margin: 0 4px; color: #a0adb2; }
	.booking-row-dates strong { color: #365b6b; }
	.booking-row-contact { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 8px; }
	.booking-row-contact a { color: #537b8b; font-size: 10px; text-decoration: none; }
	.booking-row-main .booking-notes { color: #89959a; font-style: italic; }
	.booking-status { padding: 4px 7px; border-radius: 20px; font-size: 8px; text-transform: capitalize; }
	.status-pending { background: #fcf5e9; color: #92703b; }
	.status-confirmed { background: #e9f1f3; color: #426a79; }
	.status-cancelled { background: #f0f1f1; color: #818c91; }
	.booking-row-actions { display: flex; align-items: center; gap: 7px; flex: 0 0 auto; }
	.admin-primary, .admin-secondary { min-height: 39px; padding: 0 14px; border: 0; cursor: pointer; font-size: 11px; }
	.admin-primary { background: #315565; color: #fff; }
	.admin-primary:hover { background: #254653; }
	.admin-secondary { background: #f3f6f6; color: #526771; border: 1px solid #dfe7e9; }
	.small-action { min-height: 33px; padding: 0 11px; }
	.admin-primary:disabled, .admin-secondary:disabled { opacity: .55; cursor: wait; }
	.admin-error-banner, .admin-error { color: #9a3b36; font-size: 11px; }
	.admin-error-banner { margin-bottom: 16px; padding: 12px 14px; border: 1px solid #eccdca; background: #fff4f3; }
	.admin-login-wrap { min-height: calc(100vh - 72px); display: grid; place-items: center; padding: 28px 20px; }
	.admin-login-card { width: min(100%, 410px); padding: 34px; box-shadow: 0 14px 45px rgba(31, 55, 65, .05); }
	.admin-login-card h1 { margin-bottom: 9px; font-size: 34px; }
	.admin-login-card .admin-subtitle { margin-bottom: 25px; }
	.admin-login-card label { display: block; color: #697c85; font-size: 10px; font-weight: 600; }
	.admin-login-card input { width: 100%; box-sizing: border-box; margin-top: 7px; padding: 12px; border: 1px solid #d5e0e3; background: #fff; color: #28363d; outline: none; }
	.admin-login-card input:focus { border-color: #789aaa; }
	.admin-login-card .admin-error { margin: 11px 0 0; }
	.admin-login-card .admin-primary { width: 100%; margin-top: 15px; text-align: left; display: flex; justify-content: space-between; align-items: center; }
	.admin-back { display: inline-block; margin-top: 18px; text-decoration: none; font-size: 10px; }
	@media (max-width: 760px) {
		.admin-main { width: min(100% - 28px, 620px); padding-top: 31px; }
		.admin-page-heading { align-items: flex-start; flex-direction: column; gap: 13px; }
		.admin-stats { gap: 8px; }
		.admin-stat { min-height: 85px; padding: 12px; }
		.admin-stat span { max-width: 100px; font-size: 9px; }
		.admin-stat strong { font-size: 25px; }
		.admin-stat small { font-size: 8px; }
		.admin-panel { padding: 16px 12px; }
		.calendar-day { min-height: 73px; padding: 4px; }
		.calendar-booking { padding: 3px 2px; font-size: 7px; }
		.calendar-filters { flex-wrap: wrap; }
		.calendar-legend { width: 100%; margin: 3px 0 0; }
		.booking-row { align-items: flex-start; flex-direction: column; gap: 12px; }
		.booking-row-actions { align-self: stretch; }
		.booking-row-actions button { flex: 1; }
	}
	@media (max-width: 420px) {
		.calendar-grid { font-size: 8px; }
		.calendar-weekday { font-size: 8px; }
		.calendar-day { min-height: 64px; padding: 3px 2px; }
		.calendar-day-number { width: 19px; height: 19px; font-size: 9px; }
		.calendar-booking { font-size: 6px; }
		.admin-stats { grid-template-columns: 1fr 1fr; }
		.admin-stat:last-child { grid-column: 1 / -1; }
		.admin-stat:last-child strong { grid-row: auto; }
		.admin-login-card { padding: 26px 22px; }
	}
</style>
