document.addEventListener('DOMContentLoaded', () => {

    // Use nav to toggle between views
    document.querySelector('#all').addEventListener('click', () => load_posts('all'));
    document.querySelector('#following').addEventListener('click', () => load_posts('following'));

    // By default, load all posts
    load_posts('all');
});

function load_posts(filter) {
    if (filter === 'all') {
        document.querySelector('#header').innerHTML = 'All Posts';
        document.querySelector('#all-view').style.display = 'block';
        document.querySelector('#following-view').style.display = 'none';
    } else if (filter === 'following') {
        document.querySelector('#header').innerHTML = 'Following';
        document.querySelector('#all-view').style.display = 'none';
        document.querySelector('#following-view').style.display = 'block';
    }
}