
const searchInput = document.getElementById("searchInput");
const tableBody = document.getElementById("studentsTableBody");

if (searchInput && tableBody) {
    searchInput.addEventListener("input", function () {
        const value = this.value.trim().toLowerCase();
        const rows = tableBody.querySelectorAll("tr");

        rows.forEach((row) => {
            const rowText = row.innerText.toLowerCase();
            row.style.display = rowText.includes(value) ? "" : "none";
        });
    });
}