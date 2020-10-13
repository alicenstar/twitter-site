document.addEventListener('DOMContentLoaded', () => {

    // Use nav to toggle between views
    document.querySelector('#profile').addEventListener('click', load_profile);
    document.querySelector('#all').addEventListener('click', () => load_posts('all'));
    document.querySelector('#following').addEventListener('click', () => load_posts('following'));

    // By default, load all posts
    load_posts('all');
});

function load_posts(param) {

    if (param === 'all') {
        document.querySelector('#header').innerHTML = 'All Posts';

        // Display all posts view and hide others
        document.querySelector('#profile-view').style.display = 'none';
        document.querySelector('#posts-view').style.display = 'block';
        document.querySelector('#all-view').style.display = 'block';
        document.querySelector('#following-view').style.display = 'none';

        fetch(`/posts/${param}`)
        .then(response => response.json())
        .then(posts => posts.forEach(post => {
            if (!post.num_likes) { post.num_likes = 0; }
            document.querySelector('#all-view').innerHTML += `<div class="post">
                <p class="username">${post.username}</p>
                <p class="timestamp">${post.timestamp}</p>
                <p class="content">${post.content}</p>
                <p class="likes">❤️ ${post.num_likes}</p>
                </div>`;
        }));
    }

    if (param === 'following') {
        document.querySelector('#header').innerHTML = 'Following';

        // Display following view and hide others
        document.querySelector('#profile-view').style.display = 'none';
        document.querySelector('#posts-view').style.display = 'block';
        document.querySelector('#all-view').style.display = 'none';
        document.querySelector('#following-view').style.display = 'block';

        fetch(`/posts/${param}`)
        .then(response => response.json())
        .then(posts => posts.forEach(post => {
            if (!post.num_likes) { post.num_likes = 0; }
            document.querySelector('#following-view').innerHTML += `<div class="post">
                <p class="username">${post.username}</p>
                <p class="timestamp">${post.timestamp}</p>
                <p class="content">${post.content}</p>
                <p class="likes">❤️ ${post.num_likes}</p>
                </div>`;
        }));
    }
}

function load_profile() {

    // Figure out how to display username here
    document.querySelector('#header').innerHTML = 'USERNAME';

    // Display user profile view and hide others
    document.querySelector('#profile-view').style.display = 'block';
    document.querySelector('#posts-view').style.display = 'none';
}