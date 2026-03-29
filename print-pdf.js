// Print functionality for news portal

// Initialize print button for index page
function initializeIndexPrintPDF() {
    const printBtn = document.getElementById('print-index-btn');
    
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
}

// Initialize print button for news list page
function initializeNewsPrintPDF() {
    const printBtn = document.getElementById('print-news-btn');
    
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
}

// Initialize print button for news detail page
function initializeDetailPrintPDF() {
    const printBtn = document.getElementById('print-detail-btn');
    
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
}
