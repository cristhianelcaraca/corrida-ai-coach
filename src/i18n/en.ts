// en.ts — all app texts in English (same keys as pt.ts).
import type { TKey } from "./pt";

export const en: Record<TKey, string> = {
  "app.name": "Corrida AI",
  "tab.home": "Home", "tab.plan": "Plan", "tab.mobility": "Mobility", "tab.assistant": "Assistant", "tab.profile": "Profile",
  "common.save": "Save", "common.cancel": "Cancel", "common.loading": "Loading…", "common.retry": "Try again",
  "common.logout": "Log out", "common.close": "Close", "common.min": "min", "common.km": "km",

  "auth.email": "Email", "auth.password": "Password", "auth.name": "Name", "auth.birth": "Date of birth", "auth.birthHint": "MM/DD/YYYY",
  "login.title": "Log in", "login.subtitle": "Welcome back! Keep training.", "login.submit": "Log in", "login.toRegister": "No account yet? Create one",
  "register.title": "Create account", "register.subtitle": "Create your account so we can save your workouts and progress.",
  "register.submit": "Create account", "register.toLogin": "Already have an account? Log in", "register.passwordHint": "At least 8 characters",

  "err.network": "I couldn't reach the server. Check that the backend is running and your phone is on the same network.",
  "err.invalid_credentials": "Wrong email or password.", "err.email_taken": "An account with this email already exists.",
  "err.weak_password": "Password needs at least 8 characters.", "err.invalid_email": "Invalid email.",
  "err.invalid_name": "Please enter your name.", "err.invalid_birth_date": "Invalid date of birth (you must be at least 16).",
  "err.birth_format": "Write the date like this: MM/DD/YYYY.", "err.fill_all": "Please fill in all fields.",
  "err.profile_required": "Please complete your profile first.", "err.server_error": "Server error. Please try again later.",
  "err.unauthorized": "Your session expired. Please log in again.", "err.not_found": "Not found.", "err.generic": "Something went wrong. Try again.",

  "home.greeting": "Hi, {name}!", "home.tagline": "Your AI running coach",
  "home.talk": "Talk to the assistant", "home.next": "Your latest workout",
  "home.empty": "You have no workout yet. Talk to the assistant to create your first one.", "home.openPlan": "View plan",
  "home.stat.workouts": "Workouts", "home.stat.km": "Km", "home.stat.minutes": "Run min",

  "assistant.title": "Running assistant", "assistant.intro": "Answer a few questions and I'll build a workout for you, with mobility and stretches for what you feel.",
  "assistant.needProfile": "First complete your profile (goal, level and availability).", "assistant.goProfile": "Go to profile",
  "assistant.q.feeling": "How do you feel today?", "assistant.q.maxMin": "How many minutes can you run without stopping?",
  "assistant.q.pains": "Any pain or discomfort? Tap the areas.", "assistant.q.notes": "Anything else I should know? (optional)",
  "assistant.notesHint": "E.g. slept badly, trained yesterday, pain going down stairs…",
  "assistant.create": "Create my workout", "assistant.creating": "Creating your workout…",
  "assistant.aiFallback": "The AI isn't available right now, so I used the app's safe rules to build the workout.",
  "assistant.intensity": "Pain intensity", "assistant.noRun": "Never ran", "assistant.min": "{n} min", "assistant.min30": "30+ min",
  "feeling.energy": "Energetic", "feeling.normal": "Normal", "feeling.tired": "Tired",
  "pain.mild": "Mild", "pain.moderate": "Moderate", "pain.strong": "Strong",

  "area.neck": "Neck", "area.shoulders": "Shoulders", "area.upper_back": "Upper back", "area.lower_back": "Lower back",
  "area.hips": "Hips", "area.glutes": "Glutes", "area.quads": "Quads", "area.hamstrings": "Hamstrings",
  "area.calves": "Calves", "area.shins": "Shins", "area.knees": "Knees", "area.ankles": "Ankles", "area.feet": "Feet",

  "plan.title": "Your plan", "plan.empty": "You have no workout yet. Talk to the assistant to create your first one.", "plan.talk": "Talk to the assistant",
  "plan.warmup": "Warm-up", "plan.mobility": "Mobility", "plan.workout": "Main workout", "plan.cooldown": "Cool-down and stretches",
  "plan.view": "See movement", "plan.complete": "Complete workout", "plan.done": "Workout completed", "plan.new": "Create new workout",
  "plan.duration": "Duration", "plan.intensity": "Intensity", "plan.distance": "Estimated distance", "plan.stage": "Stage {n}",
  "plan.safety": "Safety", "plan.source.ai": "Personalized by AI", "plan.source.rules": "Automatic safe plan",
  "plan.history": "History", "plan.how": "How was the workout?", "effort.easy": "Easy", "effort.ok": "Just right", "effort.hard": "Hard",
  "plan.pain": "I felt pain during the workout", "plan.send": "Save result",
  "plan.feedbackNote": "Your next workout only moves up if this one went well and pain-free.",

  "mob.title": "Mobility and stretching", "mob.forYou": "Suggested for you", "mob.all": "All exercises",
  "kind.warmup": "Warm-up", "kind.drill": "Drill", "kind.mobility": "Mobility", "kind.stretch": "Stretch", "kind.breath": "Breathing",
  "mob.areas": "Areas worked",

  "avatar.front": "Front", "avatar.side": "Side", "avatar.loading": "Loading the figure…",
  "avatar.error": "I couldn't show the 3D figure on this device.",

  "profile.title": "Profile", "profile.onboarding": "Complete your profile so the assistant can build workouts that fit you.",
  "profile.age": "{n} years old", "profile.goal": "Goal", "profile.level": "Current level", "profile.days": "Available days",
  "profile.duration": "Main workout time", "profile.limitations": "Limitations or injuries (optional)",
  "profile.saved": "Profile saved.", "profile.language": "Language", "profile.progress": "Your progress",
  "profile.last30": "Workouts in the last 30 days", "profile.maxNote": "The app only creates workouts up to 10 km.",
  "goal.start": "Start running", "goal.5k": "Run 5 km", "goal.10k": "Run 10 km",
  "level.never": "Never ran", "level.starting": "Just starting", "level.regular": "Run regularly",
  "day.mon": "Mon", "day.tue": "Tue", "day.wed": "Wed", "day.thu": "Thu", "day.fri": "Fri", "day.sat": "Sat", "day.sun": "Sun",
};
