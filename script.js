/**
 * ============================================================================
 * PORTFOLIO JAVASCRIPT - GEOLAB FULL-STACK CURRICULUM
 * Author: Nutsa Deisadze
 * Reference: https://github.com/geolab-asanidze/full-stack-2
 * 
 * Features:
 * 1. Responsive Mobile Navigation (Burger Menu toggle, outside-click, accessibility)
 * 2. Employees / Team API Integration (/users via Fetch & Async/Await, search & filter)
 * 3. Additional JSONPlaceholder Features:
 *    - Dynamic Posts Feed (/posts) with User filter & Comments Modal (/comments)
 *    - Create new Post simulation (POST to /posts)
 *    - Interactive Tasks / Todo Manager (/todos with status toggle & filtering)
 * 4. Toast Notifications, Active Nav Spy, & Smooth Contact Form Handling
 * ============================================================================
 */

'use strict';

// ============================================================================
// CONFIGURATION & API CONSTANTS
// ============================================================================
const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

const ENDPOINTS = {
  USERS: `${API_BASE_URL}/users`,
  POSTS: `${API_BASE_URL}/posts`,
  COMMENTS: (postId) => `${API_BASE_URL}/posts/${postId}/comments`,
  TODOS: `${API_BASE_URL}/todos?_limit=15`,
};

// Application State
const state = {
  users: [],
  posts: [],
  filteredPosts: [],
  postsPage: 1,
  postsPerPage: 6,
  selectedUserId: 'all',
  postsSearchQuery: '',
  todos: [],
  todoFilter: 'all', // 'all' | 'pending' | 'completed'
};

// ============================================================================
// DOM ELEMENTS SELECTION
// ============================================================================
const DOM = {
  // Navigation & Header
  header: document.getElementById('header'),
  burgerBtn: document.getElementById('burger-btn'),
  mobileNav: document.getElementById('mobile-nav'),
  navOverlay: document.getElementById('nav-overlay'),
  mobileLinks: document.querySelectorAll('.mobile-link'),
  desktopLinks: document.querySelectorAll('.nav-link'),

  // Employees / Team Section
  employeesContainer: document.getElementById('employees-container'),
  employeeSearch: document.getElementById('employee-search'),
  employeeCountBadge: document.getElementById('employee-count-badge'),
  refreshEmployeesBtn: document.getElementById('refresh-employees-btn'),

  // Interactive Tabs
  tabPostsBtn: document.getElementById('tab-posts-btn'),
  tabTodosBtn: document.getElementById('tab-todos-btn'),
  postsTabContent: document.getElementById('posts-tab-content'),
  todosTabContent: document.getElementById('todos-tab-content'),

  // Posts Feature
  postUserFilter: document.getElementById('post-user-filter'),
  postsSearch: document.getElementById('posts-search'),
  postsContainer: document.getElementById('posts-container'),
  loadMorePostsBtn: document.getElementById('load-more-posts-btn'),
  postsPaginationWrapper: document.getElementById('posts-pagination-wrapper'),

  // Post Comments Modal
  postModal: document.getElementById('post-modal'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalAuthorName: document.getElementById('modal-author-name'),
  modalPostTitle: document.getElementById('modal-post-title'),
  modalPostBody: document.getElementById('modal-post-body'),
  modalCommentsCount: document.getElementById('modal-comments-count'),
  modalCommentsContainer: document.getElementById('modal-comments-container'),

  // Create Post Modal
  createPostModal: document.getElementById('create-post-modal'),
  openNewPostModalBtn: document.getElementById('open-new-post-modal-btn'),
  createModalCloseBtn: document.getElementById('create-modal-close-btn'),
  cancelCreatePostBtn: document.getElementById('cancel-create-post-btn'),
  createPostForm: document.getElementById('create-post-form'),
  newPostAuthor: document.getElementById('new-post-author'),
  newPostTitle: document.getElementById('new-post-title'),
  newPostBody: document.getElementById('new-post-body'),

  // Todos Feature
  todosList: document.getElementById('todos-list'),
  addTodoForm: document.getElementById('add-todo-form'),
  todoInput: document.getElementById('todo-input'),
  todoFilterPills: document.querySelectorAll('.todo-filter-pills .pill-btn'),
  countAllTodos: document.getElementById('count-all-todos'),
  countPendingTodos: document.getElementById('count-pending-todos'),
  countCompletedTodos: document.getElementById('count-completed-todos'),

  // Contact Form & Footer
  contactForm: document.getElementById('contact-form'),
  currentYear: document.getElementById('current-year'),
  toastContainer: document.getElementById('toast-container'),
};

// ============================================================================
// 1. RESPONSIVE MOBILE NAVIGATION (BURGER MENU)
// ============================================================================
/**
 * Toggles the mobile navigation drawer and updates ARIA accessibility attributes.
 * @param {boolean} [forceClose=false] - If true, guarantees closing the menu.
 */
function toggleMobileMenu(forceClose = false) {
  const isOpen = DOM.mobileNav.classList.contains('active');
  const shouldOpen = forceClose ? false : !isOpen;

  if (shouldOpen) {
    DOM.burgerBtn.classList.add('active');
    DOM.burgerBtn.setAttribute('aria-expanded', 'true');
    DOM.mobileNav.classList.add('active');
    DOM.mobileNav.setAttribute('aria-hidden', 'false');
    DOM.navOverlay.classList.add('active');
    DOM.navOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  } else {
    DOM.burgerBtn.classList.remove('active');
    DOM.burgerBtn.setAttribute('aria-expanded', 'false');
    DOM.mobileNav.classList.remove('active');
    DOM.mobileNav.setAttribute('aria-hidden', 'true');
    DOM.navOverlay.classList.remove('active');
    DOM.navOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

/**
 * Initializes burger menu event listeners.
 */
function initMobileNavigation() {
  // Hamburger button click
  DOM.burgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu();
  });

  // Clicking backdrop overlay closes the menu
  DOM.navOverlay.addEventListener('click', () => {
    toggleMobileMenu(true);
  });

  // Clicking any mobile navigation link closes the menu
  DOM.mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      toggleMobileMenu(true);
    });
  });

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.mobileNav.classList.contains('active')) {
      toggleMobileMenu(true);
    }
  });

  // Auto-close if screen is resized beyond tablet breakpoint (768px)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && DOM.mobileNav.classList.contains('active')) {
      toggleMobileMenu(true);
    }
  });

  // Header background blur on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      DOM.header.classList.add('scrolled');
    } else {
      DOM.header.classList.remove('scrolled');
    }
  });
}

// ============================================================================
// 2. REQUIREMENT 2: EMPLOYEES / TEAM TAB WITH API INTEGRATION
// ============================================================================
/**
 * Fetches user list dynamically from JSONPlaceholder using fetch and async/await.
 */
async function fetchEmployees() {
  try {
    renderEmployeesSkeleton();
    DOM.employeeCountBadge.textContent = 'იტვირთება...';

    const response = await fetch(ENDPOINTS.USERS);

    if (!response.ok) {
      throw new Error(`HTTP error! სტატუსი: ${response.status}`);
    }

    const data = await response.json();
    state.users = data;

    // Render employees
    renderEmployees(state.users);

    // Also populate author select options in Posts tab
    populateAuthorDropdowns(state.users);

    showToast('თანამშრომლების სია წარმატებით ჩაიტვირთა!', 'success');
  } catch (error) {
    console.error('Error fetching employees:', error);
    renderEmployeesError(error.message);
    DOM.employeeCountBadge.textContent = 'შეცდომა';
    showToast('მონაცემების ჩატვირთვა ვერ მოხერხდა', 'error');
  }
}

/**
 * Displays skeleton placeholders while data is fetching.
 */
function renderEmployeesSkeleton() {
  DOM.employeesContainer.innerHTML = Array(6)
    .fill(0)
    .map(() => '<div class="skeleton-card"></div>')
    .join('');
}

/**
 * Displays an error card with a retry button if the API request fails.
 * @param {string} errorMessage
 */
function renderEmployeesError(errorMessage) {
  DOM.employeesContainer.innerHTML = `
    <div class="api-error-card">
      <h3>⚠️ მონაცემების ჩატვირთვა ვერ მოხერხდა</h3>
      <p class="error-msg">${escapeHTML(errorMessage)}</p>
      <button class="btn btn-primary btn-sm mt-8" onclick="fetchEmployees()">
        ხელახლა ცდა
      </button>
    </div>
  `;
}

/**
 * Renders the employee cards cleanly with their names, emails, usernames, and company details.
 * @param {Array} users - List of user objects
 */
function renderEmployees(users) {
  // Update count badge
  DOM.employeeCountBadge.textContent = `${users.length} თანამშრომელი`;

  if (!users || users.length === 0) {
    DOM.employeesContainer.innerHTML = `
      <div class="api-empty-card">
        <p>🔍 მითითებული პარამეტრით თანამშრომელი ვერ მოიძებნა.</p>
      </div>
    `;
    return;
  }

  const cardsHtml = users
    .map((user) => {
      // Generate initials for the avatar
      const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      return `
      <article class="employee-card" data-user-id="${user.id}">
        <!-- Header with Avatar and Usernames -->
        <div class="employee-header">
          <div class="employee-avatar" aria-hidden="true">${escapeHTML(initials)}</div>
          <div class="employee-titles">
            <h3 class="employee-name" title="${escapeHTML(user.name)}">${escapeHTML(user.name)}</h3>
            <div class="employee-username">@${escapeHTML(user.username)}</div>
          </div>
        </div>

        <!-- Company Details -->
        <div class="employee-company-box">
          <div class="company-name">
            <span>🏢</span>
            <strong>${escapeHTML(user.company.name)}</strong>
          </div>
          <p class="company-phrase">"${escapeHTML(user.company.catchPhrase)}"</p>
        </div>

        <!-- Contact & Location Metadata -->
        <div class="employee-info-list">
          <div class="employee-info-row">
            <span class="info-icon-sm" title="Email">✉️</span>
            <a href="mailto:${escapeHTML(user.email)}" class="info-text-link" title="${escapeHTML(user.email)}">
              ${escapeHTML(user.email)}
            </a>
          </div>

          <div class="employee-info-row">
            <span class="info-icon-sm" title="Phone">📞</span>
            <a href="tel:${escapeHTML(user.phone)}" class="info-text-link">
              ${escapeHTML(user.phone)}
            </a>
          </div>

          <div class="employee-info-row">
            <span class="info-icon-sm" title="Website">🌐</span>
            <a href="https://${escapeHTML(user.website)}" target="_blank" rel="noopener noreferrer" class="info-text-link">
              ${escapeHTML(user.website)}
            </a>
          </div>

          <div class="employee-info-row">
            <span class="info-icon-sm" title="Location">📍</span>
            <span class="info-text-link">${escapeHTML(user.address.city)}, ${escapeHTML(user.address.street)}</span>
          </div>
        </div>

        <!-- Interactive Action Button: View User Posts -->
        <div class="employee-footer">
          <button class="btn btn-outline btn-sm btn-block view-user-posts-btn" data-user-id="${user.id}" data-user-name="${escapeHTML(user.name)}">
            <span>📝 პოსტების ნახვა</span>
          </button>
        </div>
      </article>
    `;
    })
    .join('');

  DOM.employeesContainer.innerHTML = cardsHtml;

  // Add click listeners to "View User Posts" buttons
  DOM.employeesContainer.querySelectorAll('.view-user-posts-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const userId = e.currentTarget.getAttribute('data-user-id');
      const userName = e.currentTarget.getAttribute('data-user-name');
      switchToUserPosts(userId, userName);
    });
  });
}

/**
 * Filter employees dynamically via the search input in real time.
 */
function handleEmployeeSearch() {
  const query = DOM.employeeSearch.value.trim().toLowerCase();

  if (!query) {
    renderEmployees(state.users);
    return;
  }

  const filtered = state.users.filter((user) => {
    const nameMatch = user.name.toLowerCase().includes(query);
    const usernameMatch = user.username.toLowerCase().includes(query);
    const emailMatch = user.email.toLowerCase().includes(query);
    const companyMatch = user.company.name.toLowerCase().includes(query);
    const cityMatch = user.address.city.toLowerCase().includes(query);

    return nameMatch || usernameMatch || emailMatch || companyMatch || cityMatch;
  });

  renderEmployees(filtered);
}

// ============================================================================
// 3. REQUIREMENT 3: ADDITIONAL JSONPLACEHOLDER FEATURES
//    Feature A: Dynamic Posts Feed (/posts) & Comments Modal (/comments)
//    Feature B: Interactive Task List (/todos)
// ============================================================================

/**
 * Fetches all posts from JSONPlaceholder /posts.
 */
async function fetchPosts() {
  try {
    DOM.postsContainer.innerHTML = Array(6)
      .fill(0)
      .map(() => '<div class="skeleton-card"></div>')
      .join('');

    const response = await fetch(ENDPOINTS.POSTS);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    state.posts = data;
    applyPostsFilters();
  } catch (error) {
    console.error('Error fetching posts:', error);
    DOM.postsContainer.innerHTML = `
      <div class="api-error-card">
        <h3>⚠️ პოსტების ჩატვირთვა ვერ მოხერხდა</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}

/**
 * Populates author dropdowns in Posts section and Create Post Modal.
 * @param {Array} users
 */
function populateAuthorDropdowns(users) {
  // 1. Filter dropdown
  const filterOptionsHtml = [
    '<option value="all">ყველა ავტორი (თანამშრომელი)</option>',
    ...users.map((u) => `<option value="${u.id}">${escapeHTML(u.name)} (@${escapeHTML(u.username)})</option>`),
  ].join('');

  DOM.postUserFilter.innerHTML = filterOptionsHtml;

  // 2. New Post Modal author dropdown
  const createOptionsHtml = users
    .map((u) => `<option value="${u.id}">${escapeHTML(u.name)} (${escapeHTML(u.company.name)})</option>`)
    .join('');

  DOM.newPostAuthor.innerHTML = createOptionsHtml;
}

/**
 * Switches to Posts tab, sets the author filter to the requested userId,
 * and scrolls smoothly to the posts section.
 * @param {string|number} userId
 * @param {string} userName
 */
function switchToUserPosts(userId, userName) {
  // Activate Posts Tab
  switchTab('posts');

  // Set filter
  DOM.postUserFilter.value = userId;
  state.selectedUserId = userId;
  state.postsPage = 1;

  // Scroll smoothly to interactive section
  const targetSection = document.getElementById('interactive');
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth' });
  }

  // Filter and show toast
  applyPostsFilters();
  showToast(`ნაჩვენებია ${userName}-ის პოსტები`, 'success');
}

/**
 * Applies author dropdown and search filters to posts.
 */
function applyPostsFilters() {
  state.postsPage = 1;
  const userId = DOM.postUserFilter.value;
  const searchQuery = DOM.postsSearch.value.trim().toLowerCase();

  state.filteredPosts = state.posts.filter((post) => {
    const matchesUser = userId === 'all' || post.userId.toString() === userId.toString();
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery) ||
      post.body.toLowerCase().includes(searchQuery);

    return matchesUser && matchesSearch;
  });

  renderPosts();
}

/**
 * Renders paginated posts into the posts grid.
 */
function renderPosts() {
  const visibleCount = state.postsPage * state.postsPerPage;
  const currentPosts = state.filteredPosts.slice(0, visibleCount);

  if (currentPosts.length === 0) {
    DOM.postsContainer.innerHTML = `
      <div class="api-empty-card">
        <p>🔍 მითითებული ფილტრით პოსტები ვერ მოიძებნა.</p>
      </div>
    `;
    DOM.postsPaginationWrapper.style.display = 'none';
    return;
  }

  const postsHtml = currentPosts
    .map((post) => {
      // Find author name from state.users
      const author = state.users.find((u) => u.id === post.userId);
      const authorName = author ? author.name : `თანამშრომელი #${post.userId}`;

      return `
      <article class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <span class="post-author-badge">✍️ ${escapeHTML(authorName)}</span>
          <span class="post-id-tag">#${post.id}</span>
        </div>

        <h3 class="post-title">${escapeHTML(post.title)}</h3>
        <p class="post-body">${escapeHTML(post.body)}</p>

        <div class="post-footer">
          <button class="btn btn-outline btn-sm view-comments-btn" data-post-id="${post.id}" data-author="${escapeHTML(authorName)}">
            <span>💬 კომენტარები</span>
          </button>
          <span class="api-pill">/posts</span>
        </div>
      </article>
    `;
    })
    .join('');

  DOM.postsContainer.innerHTML = postsHtml;

  // Show/Hide "Load More" button
  if (visibleCount < state.filteredPosts.length) {
    DOM.postsPaginationWrapper.style.display = 'block';
  } else {
    DOM.postsPaginationWrapper.style.display = 'none';
  }

  // Attach click listeners to view comments
  DOM.postsContainer.querySelectorAll('.view-comments-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const postId = e.currentTarget.getAttribute('data-post-id');
      const author = e.currentTarget.getAttribute('data-author');
      openPostModal(postId, author);
    });
  });
}

/**
 * Fetches comments for a specific post and displays the post modal.
 * @param {string|number} postId
 * @param {string} authorName
 */
async function openPostModal(postId, authorName) {
  const post = state.posts.find((p) => p.id.toString() === postId.toString());
  if (!post) return;

  // Set post details in modal
  DOM.modalAuthorName.textContent = `ავტორი: ${authorName}`;
  DOM.modalPostTitle.textContent = post.title;
  DOM.modalPostBody.textContent = post.body;
  DOM.modalCommentsCount.textContent = 'იტვირთება...';
  DOM.modalCommentsContainer.innerHTML = `
    <div class="text-center py-4" style="color: var(--text-muted);">
      <span>⏳ კომენტარები იტვირთება...</span>
    </div>
  `;

  // Show modal
  DOM.postModal.classList.add('active');
  DOM.postModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  try {
    const res = await fetch(ENDPOINTS.COMMENTS(postId));
    if (!res.ok) throw new Error('კომენტარების ჩატვირთვა ვერ მოხერხდა');

    const comments = await res.json();
    DOM.modalCommentsCount.textContent = comments.length;

    if (comments.length === 0) {
      DOM.modalCommentsContainer.innerHTML = '<p class="text-muted">კომენტარები არ არის.</p>';
      return;
    }

    const commentsHtml = comments
      .map(
        (c) => `
      <div class="comment-item">
        <div class="comment-author">💬 ${escapeHTML(c.name)}</div>
        <span class="comment-email">${escapeHTML(c.email)}</span>
        <p class="comment-body">${escapeHTML(c.body)}</p>
      </div>
    `
      )
      .join('');

    DOM.modalCommentsContainer.innerHTML = commentsHtml;
  } catch (error) {
    console.error('Error fetching comments:', error);
    DOM.modalCommentsContainer.innerHTML = `
      <p style="color: var(--accent-rose);">⚠️ ${escapeHTML(error.message)}</p>
    `;
    DOM.modalCommentsCount.textContent = '0';
  }
}

/**
 * Closes the post details / comments modal.
 */
function closePostModal() {
  DOM.postModal.classList.remove('active');
  DOM.postModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/**
 * Handles creation of a new post with a POST fetch request simulation.
 * @param {Event} e
 */
async function handleCreatePost(e) {
  e.preventDefault();

  const authorId = parseInt(DOM.newPostAuthor.value, 10);
  const title = DOM.newPostTitle.value.trim();
  const body = DOM.newPostBody.value.trim();

  if (!title || !body) {
    showToast('გთხოვთ შეავსოთ ყველა სავალდებულო ველი', 'error');
    return;
  }

  const submitBtn = DOM.createPostForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'იგზავნება...';

  try {
    const response = await fetch(ENDPOINTS.POSTS, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        userId: authorId,
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });

    const newPost = await response.json();

    // Assign a unique client-side ID to avoid collisions
    newPost.id = state.posts.length > 0 ? Math.max(...state.posts.map((p) => p.id)) + 1 : 101;
    newPost.title = title;
    newPost.body = body;
    newPost.userId = authorId;

    // Prepend to posts list
    state.posts.unshift(newPost);
    applyPostsFilters();

    // Reset and close modal
    DOM.createPostForm.reset();
    closeCreatePostModal();

    showToast('ახალი პოსტი წარმატებით გამოქვეყნდა (POST)!', 'success');
  } catch (error) {
    console.error('Error creating post:', error);
    showToast('პოსტის დამატება ვერ მოხერხდა', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

function openCreatePostModal() {
  DOM.createPostModal.classList.add('active');
  DOM.createPostModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCreatePostModal() {
  DOM.createPostModal.classList.remove('active');
  DOM.createPostModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ----------------------------------------------------------------------------
// FEATURE B: INTERACTIVE TODOS MANAGER (/todos)
// ----------------------------------------------------------------------------
/**
 * Fetches todos from JSONPlaceholder /todos.
 */
async function fetchTodos() {
  try {
    DOM.todosList.innerHTML = '<li class="text-center py-4">იტვირთება ამოცანები...</li>';

    const response = await fetch(ENDPOINTS.TODOS);
    if (!response.ok) throw new Error('დავალებების ჩატვირთვა ვერ მოხერხდა');

    const data = await response.json();
    state.todos = data;
    renderTodos();
  } catch (error) {
    console.error('Error fetching todos:', error);
    DOM.todosList.innerHTML = `
      <li class="api-error-card">
        <p>⚠️ ${escapeHTML(error.message)}</p>
      </li>
    `;
  }
}

/**
 * Renders the todo items and updates counter badges.
 */
function renderTodos() {
  // Calculate counts
  const total = state.todos.length;
  const completed = state.todos.filter((t) => t.completed).length;
  const pending = total - completed;

  DOM.countAllTodos.textContent = total;
  DOM.countCompletedTodos.textContent = completed;
  DOM.countPendingTodos.textContent = pending;

  // Filter based on active pill
  let filtered = state.todos;
  if (state.todoFilter === 'pending') {
    filtered = state.todos.filter((t) => !t.completed);
  } else if (state.todoFilter === 'completed') {
    filtered = state.todos.filter((t) => t.completed);
  }

  if (filtered.length === 0) {
    DOM.todosList.innerHTML = `
      <li class="text-center py-6 text-muted">
        <span>🎉 ამ კატეგორიაში ამოცანები არ არის!</span>
      </li>
    `;
    return;
  }

  const itemsHtml = filtered
    .map(
      (todo) => `
    <li class="todo-item ${todo.completed ? 'completed' : ''}" data-todo-id="${todo.id}">
      <label class="todo-left">
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
        <span class="todo-text">${escapeHTML(todo.title)}</span>
      </label>
      <div style="display: flex; align-items: center;">
        <span class="todo-badge ${todo.completed ? 'badge-done' : 'badge-pending'}">
          ${todo.completed ? 'შესრულებული' : 'მოლოდინში'}
        </span>
        <button class="todo-delete-btn" data-id="${todo.id}" title="წაშლა" aria-label="ამოცანის წაშლა">✕</button>
      </div>
    </li>
  `
    )
    .join('');

  DOM.todosList.innerHTML = itemsHtml;

  // Checkbox toggle listener
  DOM.todosList.querySelectorAll('.todo-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const todoId = parseInt(e.target.getAttribute('data-id'), 10);
      toggleTodoStatus(todoId);
    });
  });

  // Delete button listener
  DOM.todosList.querySelectorAll('.todo-delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const todoId = parseInt(e.currentTarget.getAttribute('data-id'), 10);
      deleteTodo(todoId);
    });
  });
}

/**
 * Toggles a todo item's completed status.
 * @param {number} id
 */
function toggleTodoStatus(id) {
  const todo = state.todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    renderTodos();
    showToast(
      todo.completed ? 'ამოცანა მონიშნულია შესრულებულად!' : 'ამოცანა დაბრუნდა შესასრულებელში',
      'success'
    );
  }
}

/**
 * Deletes a todo item from local state.
 * @param {number} id
 */
function deleteTodo(id) {
  state.todos = state.todos.filter((t) => t.id !== id);
  renderTodos();
  showToast('ამოცანა წაიშალა', 'success');
}

/**
 * Adds a new task to the todo list.
 * @param {Event} e
 */
function handleAddTodo(e) {
  e.preventDefault();
  const text = DOM.todoInput.value.trim();
  if (!text) return;

  const newTodo = {
    id: Date.now(),
    title: text,
    completed: false,
    userId: 1,
  };

  state.todos.unshift(newTodo);
  DOM.todoInput.value = '';
  renderTodos();
  showToast('ახალი ამოცანა წარმატებით დაემატა!', 'success');
}

// ----------------------------------------------------------------------------
// TAB SWITCHING LOGIC (POSTS vs TODOS)
// ----------------------------------------------------------------------------
/**
 * Switches between interactive tabs (Posts vs Todos).
 * @param {'posts'|'todos'} tabName
 */
function switchTab(tabName) {
  if (tabName === 'posts') {
    DOM.tabPostsBtn.classList.add('active');
    DOM.tabPostsBtn.setAttribute('aria-selected', 'true');
    DOM.tabTodosBtn.classList.remove('active');
    DOM.tabTodosBtn.setAttribute('aria-selected', 'false');

    DOM.postsTabContent.classList.add('active');
    DOM.todosTabContent.classList.remove('active');
  } else {
    DOM.tabTodosBtn.classList.add('active');
    DOM.tabTodosBtn.setAttribute('aria-selected', 'true');
    DOM.tabPostsBtn.classList.remove('active');
    DOM.tabPostsBtn.setAttribute('aria-selected', 'false');

    DOM.todosTabContent.classList.add('active');
    DOM.postsTabContent.classList.remove('active');

    // Fetch todos if not already loaded
    if (state.todos.length === 0) {
      fetchTodos();
    }
  }
}

// ============================================================================
// 4. TOAST NOTIFICATIONS, ACTIVE SCROLL SPY & UTILITIES
// ============================================================================
/**
 * Displays a sleek toast notification.
 * @param {string} message - Notification text
 * @param {'success'|'error'|'info'} [type='success']
 * @param {number} [duration=3500]
 */
function showToast(message, type = 'success', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

  toast.innerHTML = `
    <span>${icon}</span>
    <span>${escapeHTML(message)}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Escapes HTML characters to prevent XSS vulnerabilities.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Initializes Active Nav Link Highlighting based on scroll position (ScrollSpy).
 */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        DOM.desktopLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  });
}

/**
 * Sets current year in footer automatically.
 */
function initFooterYear() {
  if (DOM.currentYear) {
    DOM.currentYear.textContent = new Date().getFullYear();
  }
}

/**
 * Handles dummy submission for contact form with validation.
 */
function initContactForm() {
  if (!DOM.contactForm) return;

  DOM.contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      showToast('გთხოვთ შეავსოთ ყველა სავალდებულო ველი', 'error');
      return;
    }

    DOM.contactForm.reset();
    showToast(`მადლობა ${name}! თქვენი შეტყობინება წარმატებით გაიგზავნა.`, 'success');
  });
}

// ============================================================================
// 5. APPLICATION INITIALIZATION (MAIN ENTRY POINT)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile burger navigation
  initMobileNavigation();

  // 2. Fetch Employees (Requirement 2)
  fetchEmployees();

  // Employee search & refresh events
  DOM.employeeSearch.addEventListener('input', handleEmployeeSearch);
  DOM.refreshEmployeesBtn.addEventListener('click', () => {
    DOM.employeeSearch.value = '';
    fetchEmployees();
  });

  // 3. Additional Features (Requirement 3: Posts & Todos)
  fetchPosts();

  // Tab controls
  DOM.tabPostsBtn.addEventListener('click', () => switchTab('posts'));
  DOM.tabTodosBtn.addEventListener('click', () => switchTab('todos'));

  // Posts controls
  DOM.postUserFilter.addEventListener('change', applyPostsFilters);
  DOM.postsSearch.addEventListener('input', applyPostsFilters);
  DOM.loadMorePostsBtn.addEventListener('click', () => {
    state.postsPage += 1;
    renderPosts();
  });

  // Post Comments Modal
  DOM.modalCloseBtn.addEventListener('click', closePostModal);
  DOM.postModal.addEventListener('click', (e) => {
    if (e.target === DOM.postModal) closePostModal();
  });

  // Create Post Modal
  DOM.openNewPostModalBtn.addEventListener('click', openCreatePostModal);
  DOM.createModalCloseBtn.addEventListener('click', closeCreatePostModal);
  DOM.cancelCreatePostBtn.addEventListener('click', closeCreatePostModal);
  DOM.createPostModal.addEventListener('click', (e) => {
    if (e.target === DOM.createPostModal) closeCreatePostModal();
  });
  DOM.createPostForm.addEventListener('submit', handleCreatePost);

  // Todos Controls
  DOM.addTodoForm.addEventListener('submit', handleAddTodo);
  DOM.todoFilterPills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      DOM.todoFilterPills.forEach((p) => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.todoFilter = e.currentTarget.getAttribute('data-filter');
      renderTodos();
    });
  });

  // 4. Utility Handlers
  initScrollSpy();
  initContactForm();
  initFooterYear();
});

