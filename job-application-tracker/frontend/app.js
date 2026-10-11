
const API_URL =
    "https://xjec93x8og.execute-api.us-east-1.amazonaws.com/dev/applications";

const USER_ID = "demo-user-1";

const form = document.getElementById("jobForm");
const jobList = document.getElementById("jobList");

const VALID_STATUSES = [
    "Applied",
    "Assessment",
    "Interview",
    "Rejected",
    "Selected"
];

let jobs = [];

// Load applications from AWS DynamoDB through API Gateway
async function loadJobs() {
    try {
        jobList.textContent = "Loading applications...";

        const response = await fetch(
            `${API_URL}?userId=${encodeURIComponent(USER_ID)}`
        );

        if (!response.ok) {
            throw new Error("Failed to load applications.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Unexpected API response.");
        }

        jobs = data;
        renderJobs();
    } catch (error) {
        console.error("Load error:", error);
        jobList.textContent =
            "Unable to load applications. Please try again.";
    }
}

// Update dashboard counters and render applications
function renderJobs() {
    document.getElementById("total").textContent = jobs.length;

    document.getElementById("interviews").textContent =
        jobs.filter(job => job.status === "Interview").length;

    document.getElementById("offers").textContent =
        jobs.filter(job => job.status === "Selected").length;

    jobList.replaceChildren();

    if (jobs.length === 0) {
        jobList.textContent = "No applications added yet.";
        return;
    }

    jobs.forEach(job => {
        const item = document.createElement("div");
        item.className = "job";

        const heading = document.createElement("h3");
        heading.textContent = `${job.company} — ${job.role}`;

        const details = document.createElement("p");
        details.textContent = `Date: ${job.date} | Status: ${job.status}`;

        const editButton = document.createElement("button");
        editButton.textContent = "Edit Status";

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.style.marginLeft = "8px";
        deleteButton.style.background = "#b91c1c";

        editButton.addEventListener("click", () => editStatus(job));

        deleteButton.addEventListener("click", () => deleteJob(job));

        item.append(heading, details, editButton, deleteButton);
        jobList.appendChild(item);
    });
}

// Add a new application to AWS
form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const application = {
        userId: USER_ID,
        company: document.getElementById("company").value.trim(),
        role: document.getElementById("role").value.trim(),
        date: document.getElementById("date").value,
        status: document.getElementById("status").value
    };

    if (
        !application.company ||
        !application.role ||
        !application.date ||
        !VALID_STATUSES.includes(application.status)
    ) {
        alert("Please fill in all fields correctly.");
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(application)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to save application.");
        }

        form.reset();
        await loadJobs();

        alert("Application added successfully!");
    } catch (error) {
        console.error("Add error:", error);
        alert("Could not add application: " + error.message);
    } finally {
        submitButton.disabled = false;
    }
});

// Edit application status
async function editStatus(job) {
    const newStatus = prompt(
        `Update status for ${job.company}:\n\n${VALID_STATUSES.join(", ")}`,
        job.status
    );

    if (newStatus === null) return;

    const status = newStatus.trim();

    if (!VALID_STATUSES.includes(status)) {
        alert("Invalid status. Choose one of the listed statuses.");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: USER_ID,
                applicationId: job.applicationId,
                status: status
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to update status.");
        }

        await loadJobs();
        alert("Application status updated!");
    } catch (error) {
        console.error("Update error:", error);
        alert(
            "Could not update application. Check API Gateway CORS settings. " +
            error.message
        );
    }
}

// Delete an application from AWS
async function deleteJob(job) {
    const confirmed = confirm(
        `Are you sure you want to delete ${job.company} — ${job.role}?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(API_URL, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: USER_ID,
                applicationId: job.applicationId
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to delete application.");
        }

        await loadJobs();
        alert("Application deleted successfully!");
    } catch (error) {
        console.error("Delete error:", error);
        alert(
            "Could not delete application. Check API Gateway CORS settings. " +
            error.message
        );
    }
}

// Load saved applications when the page opens
loadJobs();
