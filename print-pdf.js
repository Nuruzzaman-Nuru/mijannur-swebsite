// Print and PDF functionality for news portal

// Initialize print/PDF buttons for index page
function initializeIndexPrintPDF() {
    const printBtn = document.getElementById('print-index-btn');
    const pdfBtn = document.getElementById('pdf-index-btn');
    
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    if (pdfBtn) {
        pdfBtn.addEventListener('click', downloadPagePDF);
    }
}

// Initialize print/PDF buttons for news list page
function initializeNewsPrintPDF() {
    const printBtn = document.getElementById('print-news-btn');
    const pdfBtn = document.getElementById('pdf-news-btn');
    
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    if (pdfBtn) {
        pdfBtn.addEventListener('click', downloadPagePDF);
    }
}

// Initialize print/PDF buttons for news detail page
function initializeDetailPrintPDF() {
    const printBtn = document.getElementById('print-detail-btn');
    const pdfBtn = document.getElementById('pdf-detail-btn');
    
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    if (pdfBtn) {
        pdfBtn.addEventListener('click', downloadPagePDF);
    }
}

// Download entire page as PDF
function downloadPagePDF() {
    const element = document.documentElement.cloneNode(true);
    
    // Remove print/PDF buttons from the cloned element
    const buttons = element.querySelectorAll('#print-index-btn, #print-news-btn, #print-detail-btn, #pdf-index-btn, #pdf-news-btn, #pdf-detail-btn');
    buttons.forEach(btn => {
        if (btn.parentElement) {
            btn.parentElement.removeChild(btn);
        }
    });
    
    // Remove action-buttons container if it's empty
    const actionButtons = element.querySelectorAll('.action-buttons');
    actionButtons.forEach(container => {
        if (container.children.length === 0 && container.parentElement) {
            container.parentElement.removeChild(container);
        }
    });
    
    const opt = {
        margin: 5,
        filename: `page-${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().set(opt).from(element).save();
}
