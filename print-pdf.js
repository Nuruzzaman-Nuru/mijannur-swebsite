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
            imageBtn.setAttribute('aria-busy', 'true');
            let exportPage;
            try {
                if (typeof window.html2canvas !== 'function') {
                    throw new Error('PNG export library is unavailable');
                }

                await document.fonts.ready;
                exportPage = createNewspaperExportPage();
                document.body.appendChild(exportPage);
                await waitForExportImages(exportPage);

                const canvas = await window.html2canvas(exportPage, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    allowTaint: false,
                    logging: false,
                    windowWidth: 1200,
                    windowHeight: exportPage.scrollHeight
                });
                const blob = await new Promise((resolve, reject) => canvas.toBlob(value => {
                    if (value) resolve(value);
                    else reject(new Error('Could not encode newspaper image'));
                }, 'image/png'));
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `${createSafeNewsFilename()}.png`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            } catch (error) {
                console.error('Could not export news as PNG:', error);
                window.alert('PNG তৈরি করা যায়নি। পেজটি আবার লোড করে চেষ্টা করুন।');
            } finally {
                if (exportPage) exportPage.remove();
                imageBtn.removeAttribute('aria-busy');
                imageBtn.disabled = false;
            }
        });
    }
}

function createNewspaperExportPage() {
    const detail = document.querySelector('#detail-content');
    const title = detail && detail.querySelector('.detail-title');
    const image = detail && detail.querySelector('.detail-image');
    const description = detail && detail.querySelector('.detail-description');
    const meta = detail && detail.querySelector('.detail-meta');
    const mastheadLogo = document.querySelector('.print-masthead-logo');

    if (!title || !description) throw new Error('News content is not ready for export');

    const page = document.createElement('section');
    page.className = 'newspaper-export';
    page.style.cssText = [
        'position:absolute', 'left:-12000px', 'top:0', 'width:1100px', 'box-sizing:border-box',
        'padding:22px 28px 18px', 'background:#fff', 'color:#202020',
        'font-family:"Noto Sans Bengali","Noto Sans Bengali UI",sans-serif', 'border:2px solid #166534'
    ].join(';');

    const make = (tag, className, text) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    };
    const header = make('header', 'newspaper-export-header');
    header.style.cssText = 'display:grid;grid-template-columns:145px 1fr 270px;gap:18px;align-items:center;border-bottom:7px solid #176b32;padding:0 0 12px';

    const logo = make('img', 'newspaper-export-logo');
    logo.src = mastheadLogo ? mastheadLogo.src : 'images/logo.png';
    logo.alt = 'সংবাদপত্রের লোগো';
    logo.style.cssText = 'width:136px;height:120px;object-fit:contain';
    const brand = make('div', 'newspaper-export-brand');
    brand.style.cssText = 'text-align:center';
    const brandName = make('div', '', 'M TV প্রতিদিনের সংবাদ');
    brandName.style.cssText = 'font-size:43px;font-weight:800;color:#126b32;line-height:1.3;margin-top:10px';
    const brandTagline = make('div', '', 'দেশ ও জনতার কথা');
    brandTagline.style.cssText = 'font-size:19px;font-weight:700;color:#7d1010;margin-top:2px';
    const dateLine = make('div', 'newspaper-export-date', meta ? meta.innerText.replace(/\s+/g, ' ').trim() : 'সর্বশেষ সংবাদ');
    dateLine.style.cssText = 'font-size:15px;background:#176b32;color:#fff;text-align:center;padding:6px 10px;margin-top:12px';
    brand.append(brandName, brandTagline, dateLine);

    const topAd = make('div', 'newspaper-export-ad newspaper-export-ad-top');
    topAd.style.cssText = 'height:92px;border:2px solid #d5a521;background:#fff8d9;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#542d13;padding:8px;box-sizing:border-box';
    const adLabel = make('small', '', 'বিজ্ঞাপন');
    adLabel.style.cssText = 'color:#8b6a14;font-size:13px';
    const adTitle = make('strong', '', 'আপনার প্রতিষ্ঠানের প্রচারে');
    adTitle.style.cssText = 'font-size:19px';
    const adText = make('span', '', 'এখানে বিজ্ঞাপন দিন');
    adText.style.cssText = 'font-size:16px';
    topAd.append(adLabel, adTitle, adText);
    header.append(logo, brand, topAd);

    const headline = make('h1', 'newspaper-export-headline', title.innerText.trim());
    headline.style.cssText = 'font-size:32px;line-height:1.4;text-align:center;margin:20px 0 17px;padding:0 14px 13px;border-bottom:1px solid #ddd;color:#111';
    const story = make('div', 'newspaper-export-story');
    story.style.cssText = 'display:grid;grid-template-columns:36% 1fr;gap:20px;align-items:start';
    const photoColumn = make('div', 'newspaper-export-photo-column');
    if (image && image.src) {
        const photo = make('img', 'newspaper-export-photo');
        photo.crossOrigin = 'anonymous';
        photo.src = image.src;
        photo.alt = image.alt || title.innerText.trim();
        photo.style.cssText = 'width:100%;height:310px;object-fit:cover;border:1px solid #aaa;display:block';
        photo.onerror = () => { photo.src = logo.src; photo.style.objectFit = 'contain'; photo.style.background = '#f2f2f2'; };
        photoColumn.appendChild(photo);
        const caption = make('div', '', image.alt || title.innerText.trim());
        caption.style.cssText = 'font-size:13px;color:#555;margin-top:5px';
        photoColumn.appendChild(caption);
    }
    const storyText = make('div', 'newspaper-export-body', description.innerText.trim());
    storyText.style.cssText = 'font-size:17px;line-height:1.8;text-align:justify;white-space:pre-line;column-count:2;column-gap:24px;column-rule:1px solid #ddd';
    story.append(photoColumn, storyText);

    const bottomAd = make('div', 'newspaper-export-ad newspaper-export-ad-bottom');
    bottomAd.style.cssText = 'margin-top:18px;padding:11px 16px;border:1px solid #c89b1c;background:#fff8d9;text-align:center;color:#573814;display:flex;justify-content:center;align-items:center;gap:12px';
    const bottomLabel = make('strong', '', 'বিজ্ঞাপন');
    const bottomCopy = make('span', '', 'আপনার ব্যবসা ও প্রতিষ্ঠানের বিজ্ঞাপন প্রকাশে যোগাযোগ করুন');
    bottomAd.append(bottomLabel, bottomCopy);

    const footer = make('footer', 'newspaper-export-footer');
    footer.style.cssText = 'margin-top:17px;padding:11px 4px 0;border-top:4px solid #176b32;text-align:center;font-size:14px;line-height:1.7;color:#333';
    const footerName = make('strong', '', 'M TV প্রতিদিনের সংবাদ');
    const footerContact = make('div', '', 'সম্পাদকীয় ও বিজ্ঞাপন বিভাগ');
    const footerNote = make('div', '', 'সর্বস্বত্ব সংরক্ষিত © M TV');
    footer.append(footerName, footerContact, footerNote);
    page.append(header, headline, story, bottomAd, footer);
    return page;
}

async function waitForExportImages(container) {
    await Promise.all(Array.from(container.querySelectorAll('img'), image => {
        if (image.complete && image.naturalWidth) return Promise.resolve();
        return new Promise(resolve => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
            window.setTimeout(resolve, 5000);
        });
    }));
}

function createSafeNewsFilename() {
    const title = document.querySelector('.detail-title');
    const safeTitle = (title ? title.innerText : 'news')
        .trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/\s+/g, '-').slice(0, 70);
    return safeTitle || 'news';
}
