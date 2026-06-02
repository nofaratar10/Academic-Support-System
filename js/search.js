document.addEventListener("DOMContentLoaded", () => {
    const topSearch = document.getElementById("searchInput");      
    const bottomFilter = document.getElementById("filterInput");    
    const filterYear = document.getElementById("filterYear");       
    const filterSemester = document.getElementById("filterSemester"); 
    
    function executeGlobalFilter() {
        const tableBody = document.getElementById("studentsTableBody") || document.querySelector("tbody");
        if (!tableBody) return; 
        
        const rows = tableBody.querySelectorAll("tr");
        
        const topSearchVal = topSearch ? topSearch.value.trim().toLowerCase() : "";
        const bottomFilterVal = bottomFilter ? bottomFilter.value.trim().toLowerCase() : "";
        const selectedYear = filterYear ? filterYear.value : "";
        const selectedSemester = filterSemester ? filterSemester.value : "";

        rows.forEach(row => {
            if (row.cells.length <= 1 && row.innerText.includes("🔍")) return;

            const rowText = row.innerText.toLowerCase();
            
            const matchesTop = topSearchVal === "" || rowText.includes(topSearchVal);
            
            const matchesBottom = bottomFilterVal === "" || rowText.includes(bottomFilterVal);
            
            const matchesYear = selectedYear === "" || rowText.includes(selectedYear.toLowerCase());
            
            const matchesSemester = selectedSemester === "" || rowText.includes(selectedSemester.toLowerCase());

            if (matchesTop && matchesBottom && matchesYear && matchesSemester) {
                row.style.display = "";  
            } else {
                row.style.display = "none"; 
            }
        });
    }

    if (topSearch) topSearch.addEventListener("input", executeGlobalFilter);
    if (bottomFilter) bottomFilter.addEventListener("input", executeGlobalFilter);
    if (filterYear) filterYear.addEventListener("change", executeGlobalFilter);
    if (filterSemester) filterSemester.addEventListener("change", executeGlobalFilter);
    
    window.addEventListener("dataLoaded", executeGlobalFilter);
});