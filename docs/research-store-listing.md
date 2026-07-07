SUMMARY:
Fleek - Workout Tracker, Log (Android package com.primero.fleekfrontend, iOS app id 1576993198) is a gym workout logging app developed by DLT Partners Inc. (Korean: 주식회사 디엘티파트너스, Seoul; CEO Jaemyung Shin; support@fleek.fit). It appears in MWM's app catalog but store listings credit DLT Partners. Korean store title: "플릭 - 운동일지, 운동기록, 운동일기, 운동루틴, 헬스". First released Aug 12, 2021. Current versions as of July 2026: iOS 3.7.40 ("fix minor bugs", released ~5 days before 2026-07-07), Android 3.7.34 (June 22, 2026). Requires iOS 14+/watchOS 10+, ~185 MB, languages English and Korean. Ratings: 4.7/5 on the US App Store (115 US ratings; ~13.3K globally per MWM); Google Play shows 100,000+ downloads (250,000+ on App Store per MWM). Recent update notes are all minor bug fixes; v3.7.28 (April 2026) fixed login errors. Notably, recent reviews document serious login failures, data loss (users losing 2+ years of history), and Apple Watch sync breakage after server-side changes — strong validation for rebuilding the core as a local offline app.

Positioning/tagline (verbatim from Play listing): "Logging Maketh Muscle. Track for better than yesterday." The app's pitch: systemized workout routines, easy logging, and dynamic growth charts.

CONCRETE MECHANICS (what to rebuild):
(1) Exercise library: 400+ exercises supported; users can add custom exercises. Exercises are categorized (strength: machines/free weights; cardio: treadmill, cycling, rowing; home/bodyweight: bands, home gym) and carry push/pull classification plus anatomical muscle diagrams showing target muscles.
(2) Workout logging screen: pick exercises, then log per-set weight (kg) and reps; cardio/timed exercises log time. Sets are added row by row. A rest timer runs between sets, with automatic rest-time suggestions "based on fitness expert recommendations". At the end, a workout summary shows calories burned, total volume, and duration.
(3) History: past workouts browsable via a calendar view and a chronological list.
(4) Growth/progress charts: dynamic per-exercise and overall graphs and stats; compare performance over time, set benchmarks; quantified improvement metrics.
(5) Muscle fatigue analysis: current muscle fatigue rendered on an anatomical body figure (front/back), so users can see which body parts today's workout stressed and modulate intensity; plus "Used Muscle" statistics aggregated over 7 / 30 / 90 days and all-time.
(6) Routines: create/modify custom workout routines organized by muscle group via an intuitive builder; save and reuse them; routines can also be imported/copied from other users.
(7) Social layer (server-dependent): follow other users, view their workout records, upload your routines and copy theirs, and relative comparison of your performance vs other users.
(8) Trainer-trainee mode (server-dependent): personal trainers create and dispatch workout plans to trainees, manage multiple clients' records, track group routine progress, and exchange feedback.
(9) AI personalization: analyzes performance/goals/preferences to adapt workout plans; expert tips on form, nutrition, recovery. Marketing-level description; no concrete algorithm disclosed.
(10) Integrations: Apple Watch app (wrist logging, auto-sync) with HealthKit (heart-rate display, exercise time logging); Korean-market extras: InBody body-composition integration for exercise recommendations, and entering your fitness center so routines are built from that gym's available equipment. Android permissions: photos/video, microphone, physical activity, location (workout location tagging), camera.

FREE VS PREMIUM: The base app (logging, library, timer, charts, history) is free and reviews praise the free tier as generous with no aggressive paywall popups. "Fleek Pro" subscription: $2.99/month, $23.99/year, $69.99 lifetime (KRW: ₩3,900 / ₩29,000 / ₩89,000). Store listings do not itemize exactly which features are Pro-gated; Pro appears to unlock advanced analytics/AI-side features. Screenshots on the stores show: exercise selection with muscle diagrams, set/rep/kg logging screen, performance analytics charts, expert tips, muscle-fatigue anatomical view, workout history calendar, and summary statistics.

Data note: the Google Play page itself truncated on direct fetch (Play's HTML is enormous); its verbatim description was recovered via APKCombo and LDPlayer mirrors of the same listing, and cross-checked against the US and KR App Store pages and MWM's catalog page.

RECOMMENDED CORE SCOPE for the local offline rebuild: exercise library with custom exercises and muscle mapping; session logging (sets x weight x reps, time for cardio); rest timer with suggestions; workout summary (volume/calories/duration); calendar + list history; per-exercise progress charts; muscle-fatigue/used-muscle visualization on a body diagram; routine builder/reuse. Exclude (server/cloud features): social feed, trainer mode, AI plans, Watch/HealthKit sync, InBody/gym-equipment integration, subscriptions.

FEATURES:
- Exercise library (400+ exercises, custom exercises) [core=true]: Library of 400+ exercises across strength (machines, free weights), cardio (treadmill, cycling, rowing), and home/bodyweight (bands, home gym) categories. Each exercise has push/pull classification and an anatomical diagram of target muscles. Users can add their own custom exercises. Exercise selection screen is the entry point for logging.
- Workout logging (sets, reps, weight, time) [core=true]: During a workout the user picks exercises and logs each set as weight (kg) x reps; cardio/timed exercises log duration instead. Sets are entered row by row with editable weight/rep inputs. Every rep, set, and cardio session is recorded whether at gym, home, or outdoors.
- Rest timer with auto suggestions [core=true]: Rest timer runs between sets and measures rest time; the app auto-suggests rest durations 'based on fitness expert recommendations'. Displayed in real time during the logging flow.
- Workout summary [core=true]: At the end of a session a summary screen shows calories burned, total volume (weight x reps), and workout duration.
- Workout history (calendar + list) [core=true]: Historical workout records organized both as a calendar view (see at a glance which days you trained) and a chronological list; tapping a day opens that session's detail.
- Growth charts and statistics [core=true]: Dynamic graphs and stats per exercise and overall: visualize progression over time, compare performance across periods, set benchmarks. 'Track, save your workouts, and check your growth through charts!' (verbatim Play description).
- Muscle fatigue analysis / Used Muscle stats [core=true]: Current muscle fatigue is displayed on an anatomical body figure so users see which muscles today's workout stressed and adjust intensity; 'Used Muscle' statistics are aggregated over 7, 30, 90 days and all-time. Derived from the muscle mapping of logged exercises.
- Routine builder [core=true]: Create and modify custom workout routines organized by muscle group via an intuitive interface; save routines and reuse them to start sessions. Routines can also be copied from other users (social part is non-core).
- Social feed / follow / routine sharing [core=false]: Follow other users, view their workout records, upload your routines and copy theirs, and relatively compare your exercise performance against other users. Server-dependent.
- Trainer-trainee mode [core=false]: Personal trainers create and dispatch workout plans to trainees, manage multiple clients' workout records, track group routine progress, and exchange feedback with trainees. Server-dependent.
- AI personalization and expert tips [core=false]: AI analyzes performance, goals, and preferences to adapt workout plans over time; provides tips on form, nutrition, and recovery. Described only at marketing level; no algorithm details in listings.
- Apple Watch + HealthKit integration [core=false]: Companion watchOS app for wrist-based set logging with automatic sync; HealthKit integration for heart-rate display and exercise time logging.
- InBody / gym equipment integration (KR market) [core=false]: Link InBody body-composition data for exercise recommendations; register your fitness center so routines are composed from the equipment available at that gym.
- Fleek Pro subscription [core=false]: Premium tier: $2.99/month, $23.99/year, $69.99 lifetime (₩3,900/₩29,000/₩89,000). Base logging/charts/timer are free with no aggressive paywall; Pro gates advanced/AI features (exact gating not itemized in listings). Irrelevant to an offline rebuild.

SOURCES:
https://play.google.com/store/apps/details?id=com.primero.fleekfrontend
https://apps.apple.com/us/app/fleek-workout-tracker-log/id1576993198
https://apps.apple.com/kr/app/id1576993198
https://mwm.ai/apps/fleek-workout-tracker-log/1576993198
https://apkcombo.com/fleek-workout-tracker-log/com.primero.fleekfrontend/
https://kr.ldplayer.net/apps/com-primero-fleekfrontend-on-pc.html
https://fleek-workout-tracker-log-ios.soft112.com/
https://app.fleek.fit/en
