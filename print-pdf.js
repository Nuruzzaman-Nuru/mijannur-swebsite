// Print and PDF functionality for news portal

// Initialize print/PDF buttons for news list page
function initializeNewsPrintPDF() {
    const printBtn = document.getElementById('print-news-btn');
    const pdfBtn = document.getElementById('pdf-news-btn');
    
    if (printBtn) {
        printBtn.addEventListener('click', printNewsList);
    }
    
    if (pdfBtn) {
        pdfBtn.addEventListener('click', downloadNewsListPDF);
    }
}

// Initialize print/PDF buttons for news detail page
function initializeDetailPrintPDF() {
    const printBtn = document.getElementById('print-detail-btn');
    const pdfBtn = document.getElementById('pdf-detail-btn');
    
    if (printBtn) {
        printBtn.addEventListener('click', printNewsDetail);
    }
    
    if (pdfBtn) {
        pdfBtn.addEventListener('click', downloadNewsDetailPDF);
    }
}

// Print news list
function printNewsList() {
    const printWindow = window.open('', '', 'height=600,width=800');
    const newsContainer = document.getElementById('news-container');
    const title = document.querySelector('.news-section h2');
    const date = document.getElementById('current-date').textContent;
    
    const printContent = `
        <!DOCTYPE html>
        <html lang="bn">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>সব খবর - প্রিন্ট</title>
            <style>
                body {
                    font-family: 'SolaimanLipi', 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 20px;
                }
                h1 {
                    text-align: center;
                    color: #d9534f;
                    border-bottom: 3px solid #d9534f;
                    padding-bottom: 10px;
                }
                .print-date {
                    text-align: center;
                    color: #666;
                    margin-bottom: 30px;
                    font-style: italic;
                }
                .news-item {
                    margin-bottom: 25px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 15px;
                }
                .news-item:last-child {
                    border-bottom: none;
                }
                .news-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #222;
                    margin-bottom: 8px;
                }
                .news-meta {
                    font-size: 12px;
                    color: #999;
                    margin-bottom: 8px;
                }
                .news-summary {
                    font-size: 13px;
                    color: #555;
                    line-height: 1.5;
                }
                .news-category {
                    display: inline-block;
                    background-color: #d9534f;
                    color: white;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 11px;
                    margin-right: 8px;
                }
                @media print {
                    body {
                        margin: 0;
                    }
                }
            </style>
        </head>
        <body>
            <h1>${title ? title.textContent : 'সব খবর'}</h1>
            <div class="print-date">${date}</div>
            <div class="news-list">
                ${newsContainer.innerHTML}
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
    };
}

// Download news list as PDF
function downloadNewsListPDF() {
    const newsContainer = document.getElementById('news-container');
    const title = document.querySelector('.news-section h2');
    const date = document.getElementById('current-date').textContent;
    
    const element = document.createElement('div');
    element.innerHTML = `
        <div style="font-family: 'Arial', sans-serif; padding: 20px; color: #333;">
            <h1 style="text-align: center; color: #d9534f; border-bottom: 3px solid #d9534f; padding-bottom: 10px;">
                ${title ? title.textContent : 'সব খবর'}
            </h1>
            <p style="text-align: center; color: #666; margin-bottom: 30px; font-style: italic;">
                ${date}
            </p>
            <div style="line-height: 1.6;">
                ${newsContainer.innerHTML}
            </div>
            <p style="text-align: center; margin-top: 40px; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
                &copy; 2026 News Portal. All rights reserved.
            </p>
        </div>
    `;
    
    const opt = {
        margin: 10,
        filename: `news-list-${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(opt).from(element).save();
}

// Print news detail
function printNewsDetail() {
    const detailContent = document.getElementById('detail-content');
    const printWindow = window.open('', '', 'height=600,width=800');
    
    const printContent = `
        <!DOCTYPE html>
        <html lang="bn">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>খবর বিবরণ - প্রিন্ট</title>
            <style>
                body {
                    font-family: 'SolaimanLipi', 'Arial', sans-serif;
                    line-height: 1.8;
                    color: #333;
                    margin: 20px;
                }
                h1 {
                    color: #d9534f;
                    font-size: 24px;
                    border-bottom: 3px solid #d9534f;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .news-meta {
                    font-size: 13px;
                    color: #999;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #ddd;
                }
                .news-content {
                    font-size: 14px;
                    line-height: 1.8;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    margin: 15px 0;
                }
                .print-footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    font-size: 12px;
                    color: #999;
                }
                @media print {
                    body {
                        margin: 0;
                    }
                }
            </style>
        </head>
        <body>
            ${detailContent.innerHTML}
            <div class="print-footer">
                &copy; 2026 News Portal. All rights reserved.
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
    };
}

// Download news detail as PDF
function downloadNewsDetailPDF() {
    const detailContent = document.getElementById('detail-content');
    const newsTitle = detailContent.querySelector('h1');
    const titleText = newsTitle ? newsTitle.textContent : 'খবর বিবরণ';
    
    const element = document.createElement('div');
    element.innerHTML = `
        <div style="font-family: 'Arial', sans-serif; padding: 20px; color: #333; line-height: 1.8;">
            <h1 style="color: #d9534f; font-size: 24px; border-bottom: 3px solid #d9534f; padding-bottom: 15px; margin-bottom: 20px;">
                ${titleText}
            </h1>
            <div style="font-size: 13px; color: #999; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                <p style="margin: 5px 0;">প্রকাশিত: ${new Date().toLocaleDateString('bn-BD')}</p>
            </div>
            <div style="font-size: 14px; line-height: 1.8;">
                ${detailContent.innerHTML}
            </div>
            <p style="text-align: center; margin-top: 40px; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
                &copy; 2026 News Portal. All rights reserved.
            </p>
        </div>
    `;
    
    const opt = {
        margin: 10,
        filename: `news-detail-${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(opt).from(element).save();
}
