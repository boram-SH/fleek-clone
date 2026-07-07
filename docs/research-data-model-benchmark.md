SUMMARY:
DATA MODEL BENCHMARK FOR REBUILDING FLEEK'S CORE (com.primero.fleekfrontend, MWM/Primero)

Fleek's core loop (per Play Store / App Store listings): build workout routines, log every set (weight/reps, plus cardio), use a between-set rest timer, browse a 400+ exercise library with GIF demonstrations plus custom exercises, and view growth charts comparing performance over time. Social features (follow feeds, comparing performance with other users, trainer-to-trainee routine dispatch) and AI plan generation are cloud features and out of scope for a local offline rebuild.

HOW THE LEADING TRACKERS MODEL THIS DATA

1) Hevy (public OpenAPI spec — the cleanest reference, and the de-facto industry-standard shape that Fleek also follows):
- ExerciseTemplate: { id, title, type (e.g. "weight_reps" — other types cover reps-only, duration, distance), primary_muscle_group, secondary_muscle_groups[], equipment, is_custom }.
- Routine: { id, title, folder_id?, exercises[] } where routine exercise = { index, exercise_template_id, title, notes, rest_seconds, supersets_id?, sets[] } and routine set = { index, type: "normal"|"warmup"|"dropset"|"failure", weight_kg?, reps?, rep_range?{start,end}, distance_meters?, duration_seconds?, rpe?, custom_metric? }.
- Workout (a performed session): { id, title, routine_id?, description, start_time, end_time, exercises[] } with the same exercise/set shape minus rep_range. Key insight: routine sets and logged sets share one Set shape; a routine is just a workout template with target values.
- Supersets are modeled as a nullable integer group id on the exercise entry, not a separate entity.

2) Strong: exports a flat CSV where "each row is one set": Date, Workout Name, Duration, Exercise Name, Set Order, Weight, Reps, Distance, Seconds, Notes, RPE (newer versions). Confirms the same denormalized set-centric core: a set row carrying both strength (weight/reps) and cardio (distance/seconds) columns, most nullable.

3) wger (open-source Django): the most normalized/complex model — Routine (start/end dates) → Day (order, is_rest, need_logs_to_advance) → Slot (superset = multiple entries in one slot; weight_rounding/repetition_rounding) → SlotEntry (exercise link) → per-iteration progression config objects (WeightConfig, RepetitionsConfig, SetsConfig, RirConfig, RestConfig with operation replace/add/subtract, step abs/percent, requirements). History is split into WorkoutSession (date, notes, impression) and WorkoutLog (one performed set: weight, repetitions, rir, rest + target values, back-linked to routine/day/slot_entry/iteration). Good ideas to steal: session/log split, storing both actual and target per set, rest as data. The progression-rule engine is overkill for a Fleek clone.

4) Flexify (open-source Flutter, local SQLite via Drift, schema v53) and its predecessor Massive (React Native + SQLite, offline): radically flat local-first design. GymSets table: name, reps, weight, unit, created, hidden (used for template/placeholder rows), bodyWeight, duration, distance, cardio (bool), restMs, incline, planId, image, category, notes. Plans + PlanExercises (planId, exercise, enabled, sequence, maxSets, warmupSets, timers). Settings table holds restTimers, vibrate, alarmSound, strengthUnit, cardioUnit, repEstimation, etc. Proves a single-user offline app works fine with 4-6 tables and per-set denormalization (exercise referenced by name, unit stored per set so history survives unit changes).

PROGRESS METRICS (what to compute, not store)
- Estimated 1RM (Wikipedia): Epley 1RM = w·(1 + r/30); Brzycki 1RM = w·36/(37−r) (identical at r=10, Epley higher below); also Lombardi w·r^0.10, O'Conner w·(1+0.025r), Wathen, Mayhew, Landers. Standard practice (Hevy/Strong): use Epley or Brzycki, only for sets with 1≤r≤10-12, ignore warmup sets.
- Volume = Σ(weight × reps) per exercise/session/muscle group; sets-per-muscle-group per week.
- PRs per exercise: max weight, max reps at a weight, best est-1RM, best session volume — computed by scanning history at set-save time and flagging the set.
- Charts: est-1RM over time, total volume over time, body weight; typically best-set-per-day aggregation with period filters (1M/3M/1Y/all).

RECOMMENDED MINIMAL SCHEMA (TypeScript-ish, for local SQLite/IndexedDB)

type ExerciseType = 'weight_reps' | 'reps_only' | 'duration' | 'distance_duration' | 'weight_distance';
type MuscleGroup = 'chest'|'back'|'shoulders'|'biceps'|'triceps'|'quads'|'hamstrings'|'glutes'|'calves'|'abs'|'forearms'|'full_body'|'cardio'|'other';
type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

interface Exercise { id: string; name: string; type: ExerciseType; primaryMuscle: MuscleGroup; secondaryMuscles: MuscleGroup[]; equipment?: string; mediaUri?: string; /* gif/image */ isCustom: boolean; isArchived: boolean; }

interface Routine { id: string; name: string; folderId?: string; note?: string; createdAt: number; updatedAt: number; exercises: RoutineExercise[]; }
interface RoutineExercise { id: string; exerciseId: string; order: number; supersetGroup?: number; restSeconds?: number; note?: string; sets: RoutineSet[]; }
interface RoutineSet { order: number; type: SetType; targetWeightKg?: number; targetReps?: number; targetRepRange?: { min: number; max: number }; targetDurationSec?: number; targetDistanceM?: number; targetRpe?: number; }

interface Workout { id: string; routineId?: string; name: string; startedAt: number; endedAt?: number; note?: string; bodyWeightKg?: number; exercises: WorkoutExercise[]; }
interface WorkoutExercise { id: string; exerciseId: string; order: number; supersetGroup?: number; restSeconds?: number; note?: string; sets: WorkoutSet[]; }
interface WorkoutSet { id: string; order: number; type: SetType; weightKg?: number; reps?: number; durationSec?: number; distanceM?: number; rpe?: number; isCompleted: boolean; completedAt?: number; prFlags?: ('weight'|'e1rm'|'volume'|'reps')[]; }

interface Settings { weightUnit: 'kg'|'lb'; distanceUnit: 'km'|'mi'; defaultRestSeconds: number; restTimerSound: boolean; restTimerVibrate: boolean; e1rmFormula: 'epley'|'brzycki'; firstDayOfWeek: number; }
// Derived (not stored): e1rm(set) = set.weightKg * (1 + set.reps/30); volume = Σ weightKg*reps; PR scan over WorkoutSet by exerciseId.

Store canonical weights in kg, convert at display time (Hevy's approach); or store unit per set (Flexify's approach) — kg-canonical is simpler. Persist tables as exercises, routines, routine_exercises, routine_sets, workouts, workout_exercises, workout_sets, settings (8 tables), or embed exercises/sets as JSON in routine/workout docs if using a document store. The active-workout screen is just a draft Workout pre-populated from the Routine's target values with checkboxes per set (isCompleted), auto-starting the rest timer (restSeconds from the exercise entry, else Settings default) on set completion. "Previous" column values come from the last completed WorkoutSet for the same exerciseId.

FEATURES:
- Exercise library with custom exercises [core=true]: Searchable/filterable list of 400+ built-in exercises (Fleek advertises 400+ types with GIF demonstrations), filter by muscle group and equipment. Each exercise has: name, exercise type (weight_reps / reps_only / duration / distance_duration), primary muscle, secondary muscles, equipment, media (gif/image). User can create custom exercises (name + type + muscle + equipment), matching Hevy's ExerciseTemplate with is_custom flag. Tapping an exercise shows detail tabs: About (media, muscles), History (past sets), Charts (e1RM/volume over time), Records (PRs).
- Routine (template) builder [core=true]: Create/edit named routines: pick exercises from library, order them, and define per-exercise target sets (set type, target weight, target reps or rep range, target RPE) and a per-exercise rest-timer duration. Hevy models this as Routine -> routine exercise (index, exercise_template_id, rest_seconds, superset_id, notes) -> routine sets sharing the same shape as logged sets plus rep_range{start,end}. Routines can be duplicated and optionally grouped in folders. Starting a workout from a routine pre-fills the log screen with the targets.
- Active workout logging screen [core=true]: Start an empty workout or start from a routine. Shows exercise cards each with a set table: columns Set# / Previous (last session's weight x reps for that exercise) / Weight / Reps / checkmark. Tapping the checkmark marks the set completed (timestamps it) and triggers the rest timer. Add set, add exercise, reorder, per-exercise notes, replace exercise. Header shows elapsed duration, total volume, completed sets. Finish saves the Workout with startedAt/endedAt; discard deletes the draft. Draft must survive app kill (persist in-progress workout).
- Set model with types, weight/reps/RPE [core=true]: Each set row stores: order, type enum (normal | warmup | dropset | failure — Hevy's exact enum, industry standard), nullable weight_kg, reps, duration_seconds, distance_meters, optional RPE (6-10 scale, 0.5 steps as in Hevy). Which fields show depends on the exercise type (strength shows weight+reps; cardio shows duration+distance). One shared Set shape for routine targets and logged sets. Strong's export confirms one-row-per-set denormalization with nullable strength/cardio columns.
- Rest timer [core=true]: Countdown timer auto-started when a set is checked off; duration comes from the routine exercise's rest_seconds, falling back to a global default in settings. UI: circular countdown overlay/bar with +15s / -15s adjustment and skip; fires local notification + sound/vibration when done (Flexify stores restMs per record and alarmSound/vibrate in settings). Must keep counting in background.
- Progress charts (growth graphs) [core=true]: Fleek's signature 'dynamic growth charts'. Per exercise: line chart of estimated 1RM over time (best set per day), max weight, total volume, and total reps, with period filters (1M/3M/6M/1Y/All). e1RM computed via Epley w*(1+r/30) or Brzycki w*36/(37-r), excluding warmup sets and reps>10-12. Overall dashboard: workouts per week bar chart, weekly volume, optional muscle-group set distribution. All computed on the fly from workout_sets — nothing stored.
- Personal records (PR) detection [core=true]: On saving a set, compare against all prior sets of the same exercise: heaviest weight, best e1RM, best set volume (weight x reps), most reps. New records get a PR badge on the set in the finished-workout summary and are listed on the exercise's Records tab. Store as computed flags on the set (prFlags array) or recompute on demand.
- Workout history log [core=true]: Reverse-chronological list of finished workouts (name, date, duration, total volume, PR count, per-exercise summary lines like 'Bench Press 3x8 @ 80kg'), plus a calendar view with dots on training days. Tapping opens the full session detail; sessions can be edited after the fact, duplicated (repeat workout), or deleted. This is Fleek's 'log' pillar; maps to wger's WorkoutSession + WorkoutLog split.
- Supersets [core=false]: Group adjacent exercises in a routine/workout into a superset via a shared nullable integer supersetGroup id on the exercise entry (Hevy's supersets_id approach — no separate entity). UI shows grouped exercises with a colored bracket and alternates sets between them; rest timer typically only after the last exercise of the group.
- Body weight tracking [core=false]: Simple log of dated body-weight entries (Flexify: bodyWeight column; Massive had a weights table), shown as a line chart alongside strength progress; optionally snapshot bodyWeightKg on each workout for bodyweight-exercise volume math.
- Settings and units [core=false]: weight unit kg/lb (store canonical kg, convert at display), distance unit, default rest duration, rest-timer sound/vibrate toggles, e1RM formula choice (Epley/Brzycki), first day of week. Flexify's Settings table is the reference for scope.
- Routine folders [core=false]: Optional flat folders to organize routines (Hevy: routine_folders with folder_id nullable on Routine). Just an id+name+order entity.
- CSV export/import [core=false]: Export all history as one-row-per-set CSV following Strong's de-facto standard columns (Date, Workout Name, Duration, Exercise Name, Set Order, Weight, Reps, Distance, Seconds, RPE, Notes) so users can migrate to/from Strong/Hevy; import parses the same shape. Cheap to build on the recommended schema and widely expected.
- Social feed / user comparison / trainer routine dispatch [core=false]: Fleek's cloud features: follow other users, view their workout records, upload/share routines, trainers sending plans to trainees, AI plan generation. Requires a backend; explicitly excluded from the local offline rebuild. Local 'share routine as text/file' can substitute.

SOURCES:
https://play.google.com/store/apps/details?id=com.primero.fleekfrontend
https://apps.apple.com/us/app/fleek-workout-tracker-log/id1576993198
https://api.hevyapp.com/docs/
https://github.com/chrisdoc/hevy-mcp/blob/main/openapi-spec.json
https://wger.readthedocs.io/en/latest/api/routines.html
https://github.com/wger-project/wger
https://github.com/brandonp2412/Flexify
https://github.com/brandonp2412/Massive
https://help.strongapp.io/article/235-export-workout-data
https://blog.ayjc.net/posts/strong-app-parsing/
https://help.hevyapp.com/hc/en-us/articles/38001424401943-How-to-Import-Strong-App-CSV-Files-and-Export-Your-Data-in-Hevy
https://en.wikipedia.org/wiki/One-repetition_maximum
