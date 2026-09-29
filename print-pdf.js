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
            const imageUrl = imageBtn.dataset.imageUrl;
            if (!imageUrl) return;

            imageBtn.disabled = true;
            try {
                const response = await fetch(imageUrl, { cache: 'no-store' });
                if (!response.ok) throw new Error('Could not download poster');

                const blobUrl = URL.createObjectURL(await response.blob());
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'm-tv-news-poster.jpg';
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(blobUrl);
            } catch (error) {
                window.open(imageUrl, '_blank', 'noopener');
            } finally {
                imageBtn.disabled = false;
            }
        });
    }
}
