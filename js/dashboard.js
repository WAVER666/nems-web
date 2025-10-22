// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase features
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    // Handle logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await auth.signOut();
                window.location.href = 'client-portal.html';
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }

    // Load user's documents
    async function loadDocuments() {
        const user = auth.currentUser;
        if (!user) return;

        const documentsContainer = document.getElementById('documents-list');
        if (!documentsContainer) return;

        try {
            const snapshot = await db.collection('documents')
                .where('userId', '==', user.uid)
                .get();

            if (snapshot.empty) {
                documentsContainer.innerHTML = '<p>No documents found.</p>';
                return;
            }

            documentsContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                documentsContainer.innerHTML += `
                    <div class="document-item">
                        <i data-feather="file"></i>
                        <span>${data.name}</span>
                        <a href="${data.url}" target="_blank" class="btn btn-small">View</a>
                    </div>
                `;
            });
            feather.replace();
        } catch (error) {
            documentsContainer.innerHTML = '<p class="error">Error loading documents.</p>';
        }
    }

    // Load appointments
    async function loadAppointments() {
        const user = auth.currentUser;
        if (!user) return;

        const appointmentsContainer = document.getElementById('appointments-list');
        if (!appointmentsContainer) return;

        try {
            const snapshot = await db.collection('appointments')
                .where('userId', '==', user.uid)
                .orderBy('date')
                .get();

            if (snapshot.empty) {
                appointmentsContainer.innerHTML = '<p>No upcoming appointments.</p>';
                return;
            }

            appointmentsContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = new Date(data.date.seconds * 1000);
                appointmentsContainer.innerHTML += `
                    <div class="appointment-item">
                        <div class="appointment-date">
                            ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}
                        </div>
                        <div class="appointment-details">
                            ${data.description}
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            appointmentsContainer.innerHTML = '<p class="error">Error loading appointments.</p>';
        }
    }

    // Load messages
    async function loadMessages() {
        const user = auth.currentUser;
        if (!user) return;

        const messagesContainer = document.getElementById('messages-list');
        if (!messagesContainer) return;

        try {
            const snapshot = await db.collection('messages')
                .where('userId', '==', user.uid)
                .orderBy('timestamp', 'desc')
                .limit(5)
                .get();

            if (snapshot.empty) {
                messagesContainer.innerHTML = '<p>No messages found.</p>';
                return;
            }

            messagesContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = new Date(data.timestamp.seconds * 1000);
                messagesContainer.innerHTML += `
                    <div class="message-item">
                        <div class="message-header">
                            <span class="message-date">${date.toLocaleDateString()}</span>
                        </div>
                        <div class="message-content">${data.content}</div>
                    </div>
                `;
            });
        } catch (error) {
            messagesContainer.innerHTML = '<p class="error">Error loading messages.</p>';
        }
    }

    // Load payment history
    async function loadPayments() {
        const user = auth.currentUser;
        if (!user) return;

        const paymentsContainer = document.getElementById('payments-list');
        if (!paymentsContainer) return;

        try {
            const snapshot = await db.collection('payments')
                .where('userId', '==', user.uid)
                .orderBy('date', 'desc')
                .get();

            if (snapshot.empty) {
                paymentsContainer.innerHTML = '<p>No payment history found.</p>';
                return;
            }

            paymentsContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const date = new Date(data.date.seconds * 1000);
                paymentsContainer.innerHTML += `
                    <div class="payment-item">
                        <div class="payment-date">${date.toLocaleDateString()}</div>
                        <div class="payment-amount">R${data.amount.toFixed(2)}</div>
                        <div class="payment-status ${data.status.toLowerCase()}">
                            ${data.status}
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            paymentsContainer.innerHTML = '<p class="error">Error loading payment history.</p>';
        }
    }

    // Document upload functionality
    const uploadButton = document.getElementById('upload-document');
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.doc,.docx';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const user = auth.currentUser;
                    const storageRef = storage.ref(`documents/${user.uid}/${file.name}`);
                    await storageRef.put(file);
                    const url = await storageRef.getDownloadURL();

                    await db.collection('documents').add({
                        userId: user.uid,
                        name: file.name,
                        url: url,
                        uploadDate: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    loadDocuments(); // Reload documents list
                } catch (error) {
                    console.error('Error uploading document:', error);
                    alert('Error uploading document. Please try again.');
                }
            };
            input.click();
        });
    }

    // Initialize dashboard data
    auth.onAuthStateChanged(user => {
        if (user) {
            loadDocuments();
            loadAppointments();
            loadMessages();
            loadPayments();
        }
    });
});