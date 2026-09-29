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
    const imageBtn = document.getElementById('download-detail-image-btn');
    
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }

    if (imageBtn) {
        imageBtn.addEventListener('click', async function() {
            imageBtn.disabled = true;
            document.body.classList.add('exporting-print');
            const imageWrapper = document.querySelector('.detail-image-wrapper');
            const previousImageDisplay = imageWrapper ? imageWrapper.style.display : '';
            if (imageWrapper) imageWrapper.style.setProperty('display', 'none', 'important');
            try {
                if (typeof window.html2canvas !== 'function') {
                    throw new Error('PNG export library is unavailable');
                }

                await document.fonts.ready;
                const canvas = await window.html2canvas(document.querySelector('.news-detail'), {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    logging: false
                });
                const blobUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'm-tv-news-print.png';
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (error) {
                console.error('Could not export news as PNG:', error);
            } finally {
                if (imageWrapper) imageWrapper.style.display = previousImageDisplay;
                document.body.classList.remove('exporting-print');
                imageBtn.disabled = false;
            }
        });
    }
}
