function sendEmail(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const service = document.getElementById('service').value;
    const message = document.getElementById('message').value;
    
    // Create email content
    const subject = `Consultation Request: ${service}`;
    const body = `Name: ${name}%0D%0A
Email: ${email}%0D%0A
Practice Area: ${service}%0D%0A
%0D%0A
Message:%0D%0A${message}`;
    
    // Open default email client
    window.location.href = `mailto:info@nemukula.co.za,thuso@nemukula.co.za?subject=${encodeURIComponent(subject)}&body=${body}`;
    
    // Clear the form
    document.getElementById('consultationForm').reset();
    
    return false;
}