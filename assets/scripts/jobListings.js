document.getElementById('searchBar').addEventListener('input', function() {
    let filter = this.value.toLowerCase();
    let jobListings = document.getElementsByClassName('job-listing');

    for (let i = 0; i < jobListings.length; i++) {
        let jobTitle = jobListings[i].getElementsByTagName('h2')[0];
        if (jobTitle.innerText.toLowerCase().indexOf(filter) > -1) {
            jobListings[i].style.display = '';
        } else {
            jobListings[i].style.display = 'none';
        }
    }
});
