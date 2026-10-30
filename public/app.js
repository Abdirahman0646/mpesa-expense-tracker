
const transactionsTable = document.getElementById('transactions-table');
const totalReceived = document.getElementById('total-received');
const totalSent = document.getElementById('total-sent');
const transactionCount = document.getElementById('transaction-count');

const categoryForm = document.getElementById('category-form');
const categoryName = document.getElementById('category-name');
const categoryMessage = document.getElementById('category-message');
const categoryList = document.getElementById('category-list');

const categoryPopup = document.getElementById('category-popup');
const popupMessage = document.getElementById('popup-message');
const closePopup = document.getElementById('close-popup');

const popupTitle = document.getElementById('popup-title');
const cancelDelete = document.getElementById('cancel-delete');
const confirmDelete = document.getElementById('confirm-delete');

let selectedCategory = null;
let categories = [];

// Display an error or success popup
function showPopup(message) {
    popupTitle.textContent = 'Category Management';
    popupMessage.textContent = message;

    confirmDelete.style.display = 'none';
    cancelDelete.textContent = 'Close';

    categoryPopup.classList.remove('hidden');
}

// Display category deletion confirmation
function showDeleteConfirmation(id, name) {
    selectedCategory = { id, name };

    popupTitle.textContent = 'Delete Category?';
    popupMessage.textContent =
        `Are you sure you want to delete "${name}"?`;

    confirmDelete.style.display = 'inline-block';
    cancelDelete.textContent = 'Cancel';

    categoryPopup.classList.remove('hidden');
}

// Close popup
function hidePopup() {
    categoryPopup.classList.add('hidden');
    selectedCategory = null;
}

closePopup.addEventListener('click', hidePopup);
cancelDelete.addEventListener('click', hidePopup);

// Load and display categories
async function loadCategories() {
    const response = await fetch('/categories');

    if (!response.ok) {
        throw new Error('Failed to fetch categories');
    }

    categories = await response.json();

    categoryList.innerHTML = '';

    categories.forEach(category => {
        const item = document.createElement('div');
        item.classList.add('category-item');

        const name = document.createElement('span');
        name.textContent = category.name;

        item.appendChild(name);

        // Protect Uncategorized
        if (category.name.toLowerCase() === 'uncategorized') {
            const protectedLabel = document.createElement('small');
            protectedLabel.textContent = 'Protected';
            protectedLabel.classList.add('protected-category');

            item.appendChild(protectedLabel);
        } else {
            const deleteButton = document.createElement('button');

            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-category');

            deleteButton.addEventListener('click', () => {
                deleteCategory(category.id, category.name);
            });

            item.appendChild(deleteButton);
        }

        categoryList.appendChild(item);
    });
}

// Open deletion confirmation
function deleteCategory(id, name) {
    showDeleteConfirmation(id, name);
}

// Confirm and process category deletion
confirmDelete.addEventListener('click', async () => {
    if (!selectedCategory) return;

    const { id } = selectedCategory;

    confirmDelete.disabled = true;

    try {
        const response = await fetch(`/categories/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            showPopup(
                data.error || 'Unable to delete this category.'
            );
            return;
        }

        await loadCategories();
        await loadTransactions();

        showPopup('Category deleted successfully!');

    } catch (error) {
        console.error('Category deletion error:', error);
        showPopup('Something went wrong. Please try again.');

    } finally {
        confirmDelete.disabled = false;
    }
});

// Create a new category
categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = categoryName.value.trim();

    if (!name) {
        categoryMessage.textContent = 'Please enter a category name.';
        return;
    }

    try {
        const response = await fetch('/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Could not create category');
        }

        categoryMessage.textContent = 'Category created successfully!';

        categoryForm.reset();

        await loadCategories();
        await loadTransactions();

    } catch (error) {
        categoryMessage.textContent = error.message;
        console.error('Category creation error:', error);
    }
});

// Load transactions and build the table
async function loadTransactions() {
    const response = await fetch('/transactions');

    if (!response.ok) {
        throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();

    transactionsTable.innerHTML = '';

    data.forEach(transaction => {
        const row = document.createElement('tr');

        const counterparty = transaction.type === 'received'
            ? transaction.sender
            : transaction.recipient;

        const transactionDate = transaction.transaction_date
            ? new Date(transaction.transaction_date).toLocaleString()
            : 'Date unavailable';

        const transactionClass = transaction.type === 'received'
            ? 'received'
            : 'sent';

        // Reference
        const referenceCell = document.createElement('td');
        referenceCell.textContent = transaction.reference;
        row.appendChild(referenceCell);

        // Transaction type
        const typeCell = document.createElement('td');
        typeCell.textContent = transaction.type;
        typeCell.classList.add(transactionClass);
        row.appendChild(typeCell);

        // Amount
        const amountCell = document.createElement('td');
        amountCell.textContent =
            `KES ${Number(transaction.amount).toFixed(2)}`;
        amountCell.classList.add(transactionClass);
        row.appendChild(amountCell);

        // Sender or recipient
        const counterpartyCell = document.createElement('td');
        counterpartyCell.textContent = counterparty || 'Unknown';
        row.appendChild(counterpartyCell);

        // Category dropdown
        const categoryCell = document.createElement('td');
        const categorySelect = document.createElement('select');

        categories.forEach(category => {
            const option = document.createElement('option');

            option.value = category.id;
            option.textContent = category.name;

            if (category.id === transaction.category_id) {
                option.selected = true;
            }

            categorySelect.appendChild(option);
        });

        categorySelect.addEventListener('change', async () => {
            try {
                const updateResponse = await fetch(
                    `/transactions/${transaction.reference}/category`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            category_id: Number(categorySelect.value)
                        })
                    }
                );

                if (!updateResponse.ok) {
                    throw new Error('Failed to update category');
                }

                console.log('Transaction category updated');

            } catch (error) {
                console.error('Error updating category:', error);
                showPopup('Could not update the transaction category.');
            }
        });

        categoryCell.appendChild(categorySelect);
        row.appendChild(categoryCell);

        // Date
        const dateCell = document.createElement('td');
        dateCell.textContent = transactionDate;
        row.appendChild(dateCell);

        transactionsTable.appendChild(row);
    });
}

// Load financial summary
async function loadSummary() {
    const response = await fetch('/summary');

    if (!response.ok) {
        throw new Error('Failed to fetch summary');
    }

    const data = await response.json();

    totalReceived.textContent =
        `KES ${Number(data.totalReceived).toFixed(2)}`;

    totalSent.textContent =
        `KES ${Number(data.totalSent).toFixed(2)}`;

    transactionCount.textContent = data.transactionCount;
}

// Initialize dashboard
async function initializeDashboard() {
    try {
        await loadCategories();
        await loadTransactions();
        await loadSummary();

    } catch (error) {
        console.error('Dashboard loading error:', error);
    }
}

initializeDashboard();
