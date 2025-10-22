function handleConsultationSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value,
        service: document.getElementById('service').value,
        date: new Date().toISOString(),
        status: 'pending'
    };

    // Store in localStorage for confirmation page
    localStorage.setItem('consultationRequest', JSON.stringify(formData));

    // You can add email service integration here
    // For example, using EmailJS or a backend service

    // Optional: Send to your email using a temporary solution
    const emailBody = `
        New Consultation Request
        
        Name: ${formData.name}
        Email: ${formData.email}
        Service: ${formData.service}
        Message: ${formData.message}
        Date: ${new Date().toLocaleString()}
    `;

    // Redirect to confirmation page
    window.location.href = 'confirmation.html';
    return false;
}