document.addEventListener('DOMContentLoaded', () => {

    // By default, load all posts
    loadPosts('all');
    // Use nav to toggle between views
    // Checks if elements exist (user is logged in)
    if (document.querySelector('#profile')) {
        document.querySelector('#profile').addEventListener('click', evt => loadProfile(evt));
        document.querySelector('#following').addEventListener('click', () => loadPosts('following'));
    }
    document.querySelector('#all').addEventListener('click', () => loadPosts('all'));
});

// Loads posts for 'All Posts' or 'Following' pages
function loadPosts(postFilter) {

    let allForms = document.querySelectorAll('.post-form');
    const emptyNewPostForm = allForms.item(allForms.length - 1); // Gets last form (the empty one) from the array of forms
    allForms.forEach(form => {
        if (form != emptyNewPostForm) {
            form.style.display = 'none';
        }
    }); // Hides all forms except the empty form initially
    if (emptyNewPostForm) {
        emptyNewPostForm.id = 'new-post-form';
    }

    // Display all posts view and hide others
    document.querySelector('#profile-view').style.display = 'none';
    // Change page header and show/hide new post form
    if (postFilter === 'all') { document.querySelector('#header').innerHTML = 'All Posts' }
    if (postFilter === 'following') {
        document.querySelector('#header').innerHTML = 'Following';
        document.querySelector('#post-form-container').style.display = 'none';
    }

    fetch(`/posts/${postFilter}`)
    .then(response => response.json())
    .then(posts => paginatePosts(posts));
}

// Loads user profile
function loadProfile(evt) {

    const targetElement = evt.target;
    const username = targetElement.innerHTML;
    document.querySelector('#header').innerHTML = username;

    // Display user profile view and hide others
    document.querySelector('#profile-view').style.display = 'block';

    // Clear profile view before populating
    const followCounts = document.querySelector('#follow-counts');

    fetch(`/users/${username}`)
    .then(response => response.json())
    .then(userData => {
        const profile = userData.profile;
        const posts = userData.posts;
        followCounts.innerHTML = `<p id="followers">Followers: ${profile.followersCount}</p>
                                    <p id="following">Following: ${profile.followingCount}</p>`;
        followButtonChecks(userData, username);
        paginatePosts(posts);
    });
}

function followButtonChecks(userData, username) {
    
    const profile = userData.profile;
    // If user is logged in, display follow/unfollow button
    if (document.querySelector('#follow-button')) {
        const followButton = document.querySelector('#follow-button');
        var isFollowing = false;
        // Check if current user is in the profile user's followers
        profile.followers.forEach(follower => {
            if (userData.currentUser === follower.followed_by_id) {
                isFollowing = true;
            }
        });
        // Set new post form to be hidden by default
        document.querySelector('#post-form-container').style.display = 'none';
        // If the profile is the logged in user's profile, don't show follow button
        // If the profile is the logged in user's profile, show the new post form
        if (userData.currentUser === profile.id) {
            followButton.style.display = 'none';
            document.querySelector('#post-form-container').style.display = 'block';
        } else if (isFollowing === true) {
            followButton.innerHTML = 'Unfollow';
            followButton.addEventListener('click', () => adjustFollow(username));
        } else {
            followButton.innerHTML = 'Follow';
            followButton.addEventListener('click', () => adjustFollow(username));
        }
    }
}

// Creates the post divs and paginator
function paginatePosts(posts) {
    
    var paginator = {
        "numPages": 1,
        "pages": [],
        "currentPage": 1,
        "pageIterator": 0
    };

    // Get page count
    paginator.numPages = Math.ceil(posts.length / 10);
    // Populate array of pages with posts
    for (var i = 0; i < paginator.numPages; i++) {
        paginator.pages[i] = posts.splice(0,10);
    }
    // Display first page of posts
    createPostDivs(paginator.pages[0]);

    const paginatorElement = document.querySelector('#paginator');
    paginatorElement.innerHTML = `<button id="previous" class="btn btn-primary" type="button">Previous</button>
                            <p id="currentPage">Page ${paginator.currentPage}/${paginator.numPages}</p>
                            <button id="next" class="btn btn-primary" type="button">Next</button>`;

    document.querySelector('#next').addEventListener('click', () => {
        paginator.pageIterator++;
        paginator.currentPage++;
        createPostDivs(paginator.pages[paginator.pageIterator]);
        paginationDisplay(paginator);
        document.querySelector('#currentPage').innerHTML = `Page ${paginator.currentPage}/${paginator.numPages}`;
    
    });
    document.querySelector('#previous').addEventListener('click', () => {
        paginator.pageIterator--;
        paginator.currentPage--;
        createPostDivs(paginator.pages[paginator.pageIterator]);
        paginationDisplay(paginator);
        document.querySelector('#currentPage').innerHTML = `Page ${paginator.currentPage}/${paginator.numPages}`
    });
    paginationDisplay(paginator);
}

function paginationDisplay(paginator) {

    // Checks if user is on first page
    if (paginator.pageIterator === 0) { document.querySelector('#previous').style.visibility = 'hidden' }
    else { document.querySelector('#previous').style.visibility = 'visible' }
    // Checks if there is a 'next' page
    if (!paginator.pages[paginator.pageIterator + 1]) { document.querySelector('#next').style.visibility = 'hidden' }
    else { document.querySelector('#next').style.visibility = 'visible' }

}

function createPostDivs(posts) {

    const postsElement = document.querySelector('#posts-body');
    postsElement.innerHTML = '';
    posts.forEach(post => {
        if (!post.likes) { post.likes = 0 }
        postsElement.innerHTML += `<div id="post${post.id}" class="post">
                    <p class="username">${post.username}</p>
                    <p class="timestamp">${post.timestamp}</p>
                    <p class="content">${post.content}</p>
                    <p class="likes">❤️ ${post.likes}</p>
                    </div>`;
    });
    addListeners();
}

function addListeners() {

    // Add listeners to username on each post
    const postUsernames = document.querySelectorAll('.username');
    postUsernames.forEach(username => {
        username.addEventListener('click', evt => loadProfile(evt));
        // Adds 'edit' buttons to logged in user's posts
        if (document.querySelector('#profile')) {
            if (username.innerText === document.querySelector('#profile').innerText) {
                let post = username.parentNode;
                post.innerHTML += `<p class="edit">Edit</p>`;
            }
        }
    });
    // Add listeners to edit buttons
    const editButtons = document.querySelectorAll('.edit');
    editButtons.forEach(button => {
        button.addEventListener('click', evt => editPost(evt));
    });
    // Add listeners to hearts on each post
    const likeHearts = document.querySelectorAll('.likes');
    likeHearts.forEach(heart => {
        heart.addEventListener('click', evt => adjustLike(evt));
    });
}

function adjustLike(evt) {

    const postFullId = evt.target.parentNode.id;
    const postId = postFullId.match(/\d+/);
    fetch(`/likes/${postId}`)
    .then(response => response.json())
    .then(post => {
        if (!post.likes) { post.likes = 0 }
        evt.target.innerHTML = `❤️ ${post.likes}`;
    });
}

function adjustFollow(username) {

    fetch(`/follow/${username}`)
    .then(response => response.json())
    .then(userData => {
        const profile = userData.profile;
        const followButton = document.querySelector('#follow-button');
        const followersElement = document.querySelector('#followers');
        // Change what follow button says depending on if user is following
        if (userData.status === true) {
            followButton.innerHTML = 'Unfollow';
        } else {
            followButton.innerHTML = 'Follow';
        }
        // Update number of followers
        followersElement.innerHTML = `<p>Followers: ${profile.followersCount}</p>`;
    });
}

function editPost(evt) {

    const post = evt.target.parentNode;
    const postFullId = post.id;
    // Gets just the digits from the post id
    const postId = postFullId.match(/\d+/)[0];
    const postContent = post.querySelector('.content');
    // Hides content of post, displays form instead
    const contentText = postContent.innerText;
    postContent.style.display = 'none';

    // Finds corresponding form from hidden formset, displays it
    const formset = document.querySelectorAll('.post-form');
    formset.forEach(form => {
        if (form.querySelector('p').querySelector('input').value === postId) {
            const correspondingForm = form;

            const formContainer = document.createElement('FORM');
            formContainer.setAttribute('method', 'post');
            formContainer.setAttribute('action', '/');
            formContainer.setAttribute('id', 'edit-form');

            postContent.insertAdjacentElement('afterend', formContainer);
            for (i = 0; i < formset.length; i++) {
                formContainer.appendChild(form);
            }
            formContainer.appendChild(document.querySelector('#submission-data').cloneNode(true));
            formContainer.appendChild(correspondingForm);
            const saveButton = document.createElement('INPUT');
            saveButton.setAttribute('id', 'submit-edit');
            saveButton.setAttribute('class', 'btn btn-primary');
            saveButton.setAttribute('type', 'submit');
            saveButton.setAttribute('value', 'Save');

            formContainer.appendChild(saveButton);

            correspondingForm.style.display = 'block';
            post.querySelector('.edit').style.display = 'none';
            // Sets the user's focus on the edit form and sets cursor to end of textarea
            const formTextarea = correspondingForm.querySelector('textarea');
            formTextarea.focus();
            formTextarea.setSelectionRange(formTextarea.value.length, formTextarea.value.length);
        }
    });
}

// Go back and format variable names to be consistent