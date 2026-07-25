document.addEventListener("DOMContentLoaded", () => {
    const viewDash = document.getElementById("view-dashboard");
    const viewWorkout = document.getElementById("view-workout");
    const viewSummary = document.getElementById("view-summary");
    const viewBrand = document.getElementById("view-brand");

    const liveBpm = document.getElementById("live-bpm");
    const liveKcal = document.getElementById("live-kcal");
    const timerDisplay = document.getElementById("workout-timer");

    // 45-Second Timeline Animation Phases
    // 0 - 10s: Dashboard View
    // 10 - 25s: Live Workout Mode
    // 25 - 38s: Summary & Achievement
    // 38 - 45s: Brand CTA

    setTimeout(() => {
        // Phase 2: Live Workout
        viewDash.classList.remove("active");
        viewWorkout.classList.add("active");
        
        let seconds = 15;
        let bpm = 142;
        let kcal = 280;

        const interval = setInterval(() => {
            seconds++;
            bpm += Math.floor(Math.random() * 3) - 1;
            kcal += 2;

            if (liveBpm) liveBpm.innerText = bpm;
            if (liveKcal) liveKcal.innerText = kcal;
            if (timerDisplay) {
                const m = String(Math.floor(seconds / 60)).padStart(2, '0');
                const s = String(seconds % 60).padStart(2, '0');
                timerDisplay.innerText = `00:${m}:${s}`;
            }
        }, 800);

        setTimeout(() => clearInterval(interval), 15000);
    }, 10000);

    setTimeout(() => {
        // Phase 3: Summary
        viewWorkout.classList.remove("active");
        viewSummary.classList.add("active");
    }, 25000);

    setTimeout(() => {
        // Phase 4: Brand Outro
        viewSummary.classList.remove("active");
        viewBrand.classList.add("active");
    }, 38000);
});
