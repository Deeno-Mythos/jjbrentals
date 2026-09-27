<script>
	/** @type {import('./$types').PageData} */
	export let data;

	/** @param {string} publicId */
	const imageUrl = (publicId) => `https://res.cloudinary.com/${data.cloudName}/image/upload/f_auto,q_auto,w_1600,c_limit/${publicId}`;
	/** @param {string} publicId */
	const videoUrl = (publicId) => `https://res.cloudinary.com/${data.cloudName}/video/upload/f_mp4,q_auto/${publicId}.mp4`;

	const media = {
		logo: imageUrl('656979591_929149300012766_374855597577412989_n'),
		exterior: imageUrl('656794229_929080060019690_7475397778415262895_n'),
		airconRoom: imageUrl('574571708_816086364652394_4765801661185740120_n'),
		fanRoom: imageUrl('572786553_816086454652385_6750118985117689769_n'),
		airconBunkRoom: imageUrl('574245185_816085987985765_4160003240049614916_n'),
		airconProof: imageUrl('573630061_816086267985737_4359577268119799004_n'),
		bunkRoomDetail: imageUrl('573092123_816085857985778_6617812300837705147_n'),
		family: imageUrl('572233290_814408924820138_4269735488650319968_n'),
		balcony: imageUrl('518352958_724828773778154_9061133311333648112_n'),
		reception: imageUrl('518322244_724828720444826_5932466520142551646_n'),
		welcome: imageUrl('560307081_799989286262102_9111083672652526574_n'),
		video: videoUrl('AQOoSz4dhVyKvtm8HoPCOB-FAGz_rgsoA7NY2Qhrufd_Bo5SHYPyvpG5lue9jsRTO4Vj7pLyPZLZx7G5_bJeTjFKkP7oBgvAEtC606Gv0BM1mA')
	};

	const rooms = [
		{
			id: 'fan',
			name: 'Fan room',
			label: 'Non-aircon',
			price: 750,
			image: media.fanRoom,
			alt: 'Fan-cooled double bed room without air conditioning',
			details: 'A comfortable fan-cooled room at an easy daily rate.',
			features: ['Fan-cooled', 'Double bed', 'Bright windows']
		},
		{
			id: 'aircon',
			name: 'Aircon double room',
			label: 'Aircon · double bed',
			price: 850,
			image: media.airconRoom,
			alt: 'Air-conditioned room with a double bed',
			details: 'A double bed room with air conditioning.',
			features: ['Air-conditioned', 'Double bed', 'Bright curtains']
		},
		{
			id: 'aircon-bunk',
			name: 'Aircon bunk room',
			label: 'Aircon · bunk beds',
			price: 850,
			image: media.airconBunkRoom,
			alt: 'Air-conditioned bunk room with a wall-mounted unit',
			details: 'A bunk bed room with air conditioning.',
			features: ['Air-conditioned', 'Bunk beds', 'Bright windows']
		}
	];

	let selectedRoom = 'aircon';
	let checkIn = '';
	let checkOut = '';
	let guests = 2;
	let guestName = '';
	let guestPhone = '';
	let guestEmail = '';
	let notes = '';
	let submitted = false;
	let submitting = false;
	let submitError = '';
	let bookingId = '';
	let menuOpen = false;

	$: room = rooms.find((item) => item.id === selectedRoom) ?? rooms[1];
	$: nights = checkIn && checkOut ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 0;
	$: total = nights * room.price;

	/** @param {number} value */
	function formatPeso(value) {
		return `₱${value.toLocaleString('en-PH')}`;
	}

	function todayString() {
		const today = new Date();
		return new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
	}

	/** @param {string} id */
	function selectRoom(id) {
		selectedRoom = id;
		setTimeout(() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
	}

	async function submitBooking() {
		if (!guestName || !guestPhone || !checkIn || !checkOut || nights < 1 || submitting) return;
		submitting = true;
		submitError = '';
		try {
			const response = await fetch('/api/bookings', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ roomId: selectedRoom, checkIn, checkOut, guests, guestName, guestPhone, guestEmail, notes })
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || 'Your request could not be saved. Please contact us by phone.');
			bookingId = result.id;
			submitted = true;
		} catch (error) {
			submitError = error instanceof Error ? error.message : 'Your request could not be saved. Please contact us by phone.';
		} finally {
			submitting = false;
		}
	}

	function startAnotherBooking() {
		submitted = false;
		bookingId = '';
	}
</script>

<svelte:head>
	<title>JJB Rentals | Affordable stays, unforgettable memories</title>
	<meta name="description" content="Book a clean, comfortable stay at JJB Rentals. Non-aircon rooms are ₱750 per day and air-conditioned rooms are ₱850 per day." />
	<link rel="icon" href={media.logo} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="site-shell">
	<header class="topbar">
		<a class="brand" href="#top" aria-label="JJB Rentals home">
			<img src={media.logo} alt="JJB Rentals logo" />
			<span><strong>JJB</strong> Rentals</span>
		</a>

		<button class="menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onclick={() => (menuOpen = !menuOpen)}>
			<span></span><span></span>
		</button>

		<nav class:open={menuOpen}>
			<a href="#rooms" onclick={() => (menuOpen = false)}>Rooms</a>
			<a href="#story" onclick={() => (menuOpen = false)}>Our place</a>
			<a href="#gallery" onclick={() => (menuOpen = false)}>Gallery</a>
			<a href="#booking" class="nav-cta" onclick={() => (menuOpen = false)}>Book a stay <span>↗</span></a>
		</nav>
	</header>

	<main id="top">
		<section class="hero" aria-labelledby="hero-title">
			<video autoplay muted loop playsinline poster={media.exterior} aria-label="A glimpse of JJB Rentals">
				<source src={media.video} type="video/mp4" />
			</video>
			<div class="hero-overlay"></div>
			<div class="hero-content">
				<p class="eyebrow light"><span class="eyebrow-dot"></span> Stay a little closer to home</p>
				<h1 id="hero-title">Room to rest.<br /><em>Space to remember.</em></h1>
				<p class="hero-copy">A warm, easy stay made for families, friends and travelers passing through. Come for the comfort, stay for the memories.</p>
				<div class="hero-actions">
					<a class="button button-primary" href="#booking">Find your room <span>↗</span></a>
					<a class="text-link light-link" href="#rooms">Explore rooms <span>↓</span></a>
				</div>
			</div>
			<div class="hero-note"><span>JJB Rentals</span><span>Affordable stays, unforgettable memories</span></div>
		</section>

		<section class="quick-info" aria-label="JJB Rentals highlights">
			<div class="quick-item"><span class="quick-number">01</span><span><strong>Simple booking</strong><small>Choose a room, pick your dates</small></span></div>
			<div class="quick-item"><span class="quick-number">02</span><span><strong>Good value</strong><small>From ₱750 per day</small></span></div>
			<div class="quick-item"><span class="quick-number">03</span><span><strong>Made welcoming</strong><small>For stays that feel personal</small></span></div>
		</section>

		<section class="section rooms-section" id="rooms" aria-labelledby="rooms-title">
			<div class="section-heading">
				<div><p class="eyebrow">Pick your pace</p><h2 id="rooms-title">A room that fits<br /><em>your kind of stay.</em></h2></div>
				<p class="section-intro">Whether you need a cool air-conditioned room or a practical fan room, every stay comes with the same thoughtful welcome.</p>
			</div>
			<div class="room-grid">
				{#each rooms as option, index}
					<article class="room-card">
						<div class="room-image-wrap">
							<img src={option.image} alt={option.alt} />
							<span class="room-tag">{option.label}</span>
						</div>
						<div class="room-card-body">
							<div class="room-title-row"><div><p class="card-kicker">Room option {String(index + 1).padStart(2, '0')}</p><h3>{option.name}</h3></div><span class="price"><b>{formatPeso(option.price)}</b><small>/ day</small></span></div>
							<p>{option.details}</p>
							<div class="feature-list">{#each option.features as feature}<span>✓ {feature}</span>{/each}</div>
							<button class="button room-button" onclick={() => selectRoom(option.id)}>Book this room <span>↗</span></button>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section class="story section" id="story" aria-labelledby="story-title">
			<div class="story-images">
				<div class="story-main-image"><img src={media.exterior} alt="Guests outside the JJB Rentals home" /></div>
				<div class="story-small-image"><img src={media.welcome} alt="Guests arriving at JJB Rentals" /></div>
				<div class="image-note"><span>Made for good company</span><span>♥</span></div>
			</div>
			<div class="story-copy">
				<p class="eyebrow">The JJB feeling</p>
				<h2 id="story-title">Come as guests.<br /><em>Leave with a story.</em></h2>
				<p>JJB Rentals is a comfortable home base for the moments that matter: a family trip, a weekend with friends, or simply a quiet place to reset.</p>
				<p>Clean, bright rooms, a welcoming home and an easy booking process — everything you need for a stay that feels uncomplicated.</p>
				<a class="text-link" href="#gallery">See the space <span>↗</span></a>
			</div>
		</section>

		<section class="gallery-section section" id="gallery" aria-labelledby="gallery-title">
			<div class="section-heading gallery-heading"><div><p class="eyebrow">Take a look around</p><h2 id="gallery-title">The little details<br /><em>make the stay.</em></h2></div><p class="section-intro">From cozy corners to breezy outdoor spaces, see a few of the details that make JJB Rentals feel like an easy choice.</p></div>
			<div class="gallery-grid">
				<div class="gallery-tile"><img src={media.airconBunkRoom} alt="Air-conditioned bunk room" /><span>Air-conditioned bunk room</span></div>
				<div class="gallery-tile"><img src={media.fanRoom} alt="Fan-cooled double bed room without air conditioning" /><span>Fan-cooled · no aircon</span></div>
				<div class="gallery-tile"><img src={media.balcony} alt="Balcony overlooking green trees" /><span>A breath of fresh air</span></div>
				<div class="gallery-tile"><img src={media.bunkRoomDetail} alt="Bunk room with a window air conditioner and bright windows" /><span>Room to share</span></div>
				<div class="gallery-tile"><img src={media.airconProof} alt="Window air conditioner and its remote" /><span>Aircon comfort</span></div>
				<div class="gallery-tile"><img src={media.family} alt="Family and guests gathered on the front porch" /><span>A warm welcome</span></div>
				<div class="gallery-tile"><img src={media.reception} alt="Guest check-in desk at JJB Rentals" /><span>Easy check-in</span></div>
				<div class="gallery-tile gallery-note"><p>“</p><strong>Affordable stay,<br />unforgettable memories.</strong><small>— JJB Rentals</small></div>
			</div>
		</section>

		<section class="booking-section" id="booking" aria-labelledby="booking-title">
			<div class="booking-inner">
			<div class="booking-intro"><p class="eyebrow">Make it yours</p><h2 id="booking-title">Ready when<br /><em>you are.</em></h2><p>Send a booking request and we’ll get back to confirm your dates. Your total is calculated instantly — no surprises.</p><div class="contact-card"><span class="contact-icon">↗</span><div><small>Prefer to talk?</small><a href="tel:+639770779406">+63 977 077 9406</a><small>Facebook · JJB Rentals</small></div></div></div>
			<div class="booking-panel">
				{#if submitted}
					<div class="success-state"><div class="success-mark">✓</div><p class="eyebrow">Request received</p><h3>You’re on the list.</h3><p>Thanks, {guestName}. Your booking request <strong>{bookingId}</strong> is ready for confirmation.</p><div class="success-summary"><div><span>Room</span><strong>{room.name}</strong></div><div><span>Dates</span><strong>{checkIn} → {checkOut}</strong></div><div><span>Estimated total</span><strong>{formatPeso(total)}</strong></div></div><p class="small-note">We’ll contact you at {guestPhone} to confirm availability and payment details.</p><button class="button room-button" onclick={startAnotherBooking}>Make another request <span>↗</span></button></div>
				{:else}
					<form onsubmit={(event) => { event.preventDefault(); submitBooking(); }}>
						<div class="form-top"><div><p class="card-kicker">Booking request</p><h3>Plan your stay</h3></div><span class="step-count">01 <i>/</i> 02</span></div>
						<fieldset><legend>1. Choose a room</legend><div class="room-choice-grid">{#each rooms as option}<button type="button" class:active={selectedRoom === option.id} class="room-choice" onclick={() => (selectedRoom = option.id)}><span class="choice-check">{selectedRoom === option.id ? '✓' : ''}</span><span><strong>{option.label}</strong><small>{formatPeso(option.price)} / day</small></span></button>{/each}</div></fieldset>
						<fieldset><legend>2. Your dates</legend><div class="form-grid"><label>Check-in<input type="date" bind:value={checkIn} min={todayString()} required /></label><label>Check-out<input type="date" bind:value={checkOut} min={checkIn || todayString()} required /></label></div><div class="stay-total"><span>{nights ? `${nights} ${nights === 1 ? 'night' : 'nights'} · ${room.name}` : 'Select your dates to see the total'}</span><strong>{nights ? formatPeso(total) : '—'}</strong></div></fieldset>
						<fieldset><legend>3. Your details</legend><div class="form-grid"><label>Full name<input type="text" bind:value={guestName} placeholder="Your name" required /></label><label>Guests<select bind:value={guests}>{#each [1,2,3,4,5,6,7,8] as count}<option value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>{/each}</select></label></div><div class="form-grid"><label>Phone number<input type="text" inputmode="tel" autocomplete="tel" bind:value={guestPhone} placeholder="09XX XXX XXXX" required /></label><label>Email <span class="optional">optional</span><input type="email" bind:value={guestEmail} placeholder="you@email.com" /></label></div><label>Anything we should know? <span class="optional">optional</span><textarea bind:value={notes} rows="3" placeholder="Arrival time, special requests..."></textarea></label></fieldset>
						{#if submitError}<p class="booking-submit-error" role="alert">{submitError}</p>{/if}
						<button class="button button-submit" type="submit" disabled={!nights || !guestName || !guestPhone || submitting}>{submitting ? 'Sending request…' : 'Request to book'} <span>↗</span></button><p class="form-note">No payment is taken online. We’ll confirm your request personally.</p>
					</form>
				{/if}
			</div>
			</div>
		</section>
	</main>

	<footer class="footer"><div class="footer-inner"><div class="footer-brand"><img src={media.logo} alt="JJB Rentals logo" /><div><strong>JJB Rentals</strong><small>Affordable stays, unforgettable memories.</small></div></div><div class="footer-links"><a href="#rooms">Rooms</a><a href="#gallery">Gallery</a><a href="#booking">Book a stay</a><a href="/admin">Admin</a></div><div class="footer-contact"><small>Booking line</small><a href="tel:+639770779406">+63 977 077 9406</a><small>© {new Date().getFullYear()} JJB Rentals</small></div></div></footer>
</div>
