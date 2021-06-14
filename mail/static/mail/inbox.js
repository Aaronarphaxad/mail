document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email(null));
    document.querySelector('#compose-form').addEventListener("submit", postEmail);




    // By default, load the inbox
    load_mailbox('inbox');



});


// Function to submit compose mail form
function postEmail(event) {
    event.preventDefault();
    // Retrieve the data from form input tags
    const recipient = document.querySelector('#compose-recipients').value
    const subject = document.querySelector('#compose-subject').value
    let hiddenMessage = document.querySelector("#compose-hidden").value
    let bodyToSend;
    let recipientToSend;
    let subjectToSend;

    // If it is a reply, remove the re: before sending post request to the API
    if (recipient.startsWith("Re:")) {
        recipientToSend = recipient.substr(4);
        subjectToSend = subject;
        // concatenate the extra message before sending
        bodyToSend = hiddenMessage + document.querySelector('#compose-body').value;
    } else {
        subjectToSend = subject;
        recipientToSend = recipient;
        bodyToSend = document.querySelector('#compose-body').value;
    }

    // Send post request to post the email
    fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipientToSend,
                subject: subjectToSend,
                body: bodyToSend
            }),
            read: false
        })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                console.log(`Error sending email: ${result.error}`);
                return
            } else {
                load_mailbox('sent');
            }
        })
        .catch(err => console.log(err))

    return false;
}



function compose_email(email) {
    return function() {
        // Show compose view and hide other views
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'block';

        // if function has a parameter (data from fetch request)
        if (email) {
            // Add Re: to value to recipients to indicate reply and disable
            const composeRecipients = document.querySelector('#compose-recipients')
            composeRecipients.value = `Re: ${email.sender}`
            composeRecipients.disabled = true

            // Add Re: to value to indicate reply and disable
            const composeSubject = document.querySelector('#compose-subject')
            composeSubject.value = `Re: ${email.subject}`
            composeSubject.disabled = true

            // Add extra message to hidden input value to concatenate with body.value
            const composeHidden = document.querySelector('#compose-hidden')
            composeHidden.value = `On ${email.timestamp}, ${email.recipients} wrote: 
            `
        } else {
            // If there are are no parameters, empty the input values
            document.querySelector('#compose-recipients').value = "";
            document.querySelector('#compose-subject').value = '';
            document.querySelector('#compose-body').value = '';
        }

    }

}


// Function to load each mailbox
function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#viewEmail').style.display = 'none';


    // Style the buttons when they are clicked. Active buttons show color, others grey
    if (mailbox === "inbox") {
        document.querySelector('#inbox').style.borderBottom = '3px solid #d93025';
        document.querySelector('#inbox').style.color = '#black';

        document.querySelector('#sent').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#sent').style.color = '#5f6368';
        document.querySelector('#archived').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#archived').style.color = '#5f6368';
    } else if (mailbox === "sent") {
        document.querySelector('#sent').style.borderBottom = '3px solid #188038';
        document.querySelector('#sent').style.color = 'black';

        document.querySelector('#inbox').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#inbox').style.color = '#5f6368';
        document.querySelector('#archived').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#archived').style.color = '#5f6368';
    } else {
        document.querySelector('#archived').style.borderBottom = '3px solid #fabf19';
        document.querySelector('#archived').style.color = 'black';

        document.querySelector('#inbox').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#inbox').style.color = '#5f6368';
        document.querySelector('#sent').style.borderBottom = '3px solid lightgrey';
        document.querySelector('#sent').style.color = '#5f6368';
    }


    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


    // Request for emails from the specified mailbox
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            emails.forEach(email => {
                let div = document.createElement("div");
                // Style differently when it is read
                if (email.read == false) {
                    div.innerHTML =
                        ` 
                  <div class="far fa-square" style="border-top:0.2px solid grey; font-weight:bold; padding:10px;">
                  <span style="width: 240px; display: inline-block">${email.sender}</span>
                  <span>${email.subject}</span> 
                  <span style="float: right; font">${email.timestamp}</span>
                  </div>
                  `
                } else {
                    div.innerHTML =
                        ` 
                  <div class="far fa-square" style="border-top:0.2px solid grey; padding:10px; color: rgb(129, 123, 123); background-color: rgb(241, 241, 241);">
                  <span style="width: 240px; display: inline-block">${email.sender}</span>
                  <span>${email.subject}</span> 
                  <span style="float: right; font">${email.timestamp}</span>
                  </div>
                  `
                }


                // Display new div in the emails view
                document.querySelector('#emails-view').append(div)



                // Add event listener for when each item is clicked 
                div.addEventListener('click', () => {

                        //  Fetch the specific email using the id
                        fetch(`/emails/${email.id}`)
                            .then(response => response.json())
                            .then(emailView => {
                                // Send a PUT request to change the status to read only when it is clicked
                                fetch(`/emails/${email.id}`, {
                                        method: 'PUT',
                                        body: JSON.stringify({ read: true })
                                    })
                                    .then(response => { console.log(`email state changed to read`) })

                                // Make only the view email div visible and make sure it is always empty when clicked again
                                const view = document.querySelector('#viewEmail');
                                view.style.display = 'block';
                                view.innerHTML = '';
                                document.querySelector('#emails-view').style.display = 'none';
                                document.querySelector('#compose-view').style.display = 'none';

                                // Create new div and insert the email details
                                const container = document.createElement('div');

                                container.innerHTML =
                                    `
                            <div style="margin:10px;"><h2>${emailView.subject}</h2></div>
                            <div style="display: flex; justify-content: space-between">
                            <span>
                            From:
                            ${emailView.sender} <br>
                            To:
                            ${emailView.recipients}
                            </span>
                            <span>
                            ${emailView.timestamp}
                            </span>
                            </div> 
                    
                            <hr>
                            <div class="mt-3 mb-5">
                            ${emailView.body}
                            </div>
                            <hr>
                            `;

                                // add the formatted email into the view email div
                                document.querySelector('#viewEmail').append(container)

                                // Create reply button and add to container in email view
                                let replyButton = createElement('button', { 'id': 'reply-button', 'class': 'btn btn-outline-primary mt-5 mr-3 unarchive' }, 'Reply')
                                container.append(replyButton)

                                // Create archive and unarchive button
                                let archiveButton;
                                let unarchiveButton;

                                // If the email is archived, show the unarchive button and add event listener
                                if (email.archived == true) {
                                    unarchiveButton = createElement('button', { 'id': 'unarchive', 'class': 'btn btn-outline-primary mt-5 unarchive' }, 'Unarchive')
                                    container.append(unarchiveButton);
                                    const unarchive = document.getElementById('unarchive')
                                    unarchive.addEventListener('click', () => {
                                        fetch(`/emails/${email.id}`, {
                                                method: 'PUT',
                                                body: JSON.stringify({ archived: false })
                                            })
                                            .then(response => { console.log(`PUT status for updating archived state returned status code ${response.status}`) })

                                        load_mailbox('inbox')
                                    });
                                } else {
                                    // If it is not archived, display the archive button and add event listener with PUT request
                                    archiveButton = createElement('button', { 'id': 'archive', 'class': 'btn btn-outline-primary mt-5' }, 'Archive')
                                    container.append(archiveButton);
                                    const archive = document.getElementById('archive')
                                    archive.addEventListener('click', () => {
                                        fetch(`/emails/${email.id}`, {
                                                method: 'PUT',
                                                body: JSON.stringify({ archived: true })
                                            })
                                            .then(response => { console.log(`PUT status for updating archived state returned status code ${response.status}`) })

                                        load_mailbox('archived')
                                    });
                                };

                                // Hide the archive button from the sent mailbox
                                if (mailbox == 'sent') {
                                    document.querySelector('#archive').style.display = 'none';
                                    document.querySelector('#unarchive').style.display = 'none';
                                    document.querySelector('#reply-button').style.display = 'none';
                                };



                                // event listener for reply button
                                document.getElementById('reply-button').addEventListener('click', compose_email(emailView));

                            })


                    }) // End of emailView event listener

            })
        })



}

// Function to create element
function createElement(element, attribute, inner) {
    if (typeof(element) === "undefined") {
        return false;
    }
    if (typeof(inner) === "undefined") {
        inner = "";
    }
    var el = document.createElement(element);
    if (typeof(attribute) === 'object') {
        for (var key in attribute) {
            el.setAttribute(key, attribute[key]);
        }
    }
    if (!Array.isArray(inner)) {
        inner = [inner];
    }
    for (var k = 0; k < inner.length; k++) {
        if (inner[k].tagName) {
            el.appendChild(inner[k]);
        } else {
            el.appendChild(document.createTextNode(inner[k]));
        }
    }
    return el;
}