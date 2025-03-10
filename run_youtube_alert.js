// run_youtube_alert.js
const { exec } = require('child_process');
const currentDate = new Date();
//const currentDate = new Date('2025-04-15'); // 1st Tuesday
const dayOfMonth = currentDate.getDate();
const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

// Check if today is Tuesday (dayOfWeek === 2)
if (dayOfWeek === 2) {
    // Calculate the week number of the month (1st, 2nd, 3rd, 4th, 5th)
    const weekOfMonth = Math.ceil(dayOfMonth / 7);

    // Run the script only on the 1st, 3rd, and 5th Tuesday
    if (weekOfMonth === 1 || weekOfMonth === 3 || weekOfMonth === 5) {
        console.log(`Today is the ${weekOfMonth}st/rd/th Tuesday of the month. Running youtube_alert.js...`);
        exec('node ./youtube_alert_dll.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                return;
            }
            console.log(`Stdout: ${stdout}`);
        });
    } else {
        console.log(`Today is the ${weekOfMonth}nd/th Tuesday. Skipping execution.`);
    }
} else {
    console.log('Today is not Tuesday. Skipping execution.');
}