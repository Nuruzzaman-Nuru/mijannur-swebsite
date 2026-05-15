// Load footer from footer.html
document.addEventListener('DOMContentLoaded', function() {
    fetch('footer.html')
        .then(response => response.text())
        .then(data => {
            // Find the footer element and replace it, or insert if doesn't exist
            let footer = document.querySelector('footer');
            if (footer) {
                footer.outerHTML = data;
            } else {
                document.body.insertAdjacentHTML('beforeend', data);
            }
        })
        .catch(error => console.error('Error loading footer:', error));
});
