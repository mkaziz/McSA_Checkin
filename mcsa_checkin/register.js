/**
 *  The jQuery function that is run when the document is first
 *  loaded. Should be used to check essentials, such as whether
 *  the user is logged in, etc.
 */
$(document).ready(function() {
	//getCheckins();
	//alert("blah");
	checkLogIn();
});

/**Checks to see whether the user is logged in. If he is,
 * changes the page to checkin.html
 */
function checkLogIn() {
	if (localStorage["mcsa_checkin_firstname"] != null || localStorage["mcsa_checkin_userid"] != null)
		window.location = "checkin.html";
}


/** Outputs an error if the email address the user
 *  is trying to register has already been taken.
 */
function emailTaken() {
	
	var val = document.getElementById("email").value;	
	var err = document.getElementById("email-error");	
	err.innerHTML = "Email already registered.<br> Click <a href=\"login.html\">here</a> to login.";
	err.style.visibility = "visible";

}


/**Submit the form via an HTTP POST request to the server-side
 * PHP script. The parameters of the form are passed, along with 
 * a querytype which will tell the PHP which MySql command to
 * execute.
 */
function submitForm() {

    	var dat=$("form").serialize();

        $.ajax({type:"POST",
		url:"mcsa_checkin.php",
        data: dat+"&query_id=register",
        success: 
			function(html){
							if (html == "") 
								alert("return data is null.");
							processResponse(html);
							//alert(html);
						  }
        });

}

/**Processes the response from the PHP script
 */
function processResponse(html) {
	
	var jsonData = $.parseJSON(html);
	
	if (jsonData.status == 1) {
		window.location="approvalneeded.html";
	}
	else if (jsonData.status == -1) {
		
		if (jsonData.errorText == "Email Taken") {
			emailTaken();
		} 
		else {
			$("body").html("Error loading page. Please contact the administrator with this message: "+jsonData.errorText);
		}
	}
	else {
		$("body").html("Error loading page. Check your internet connection or contact an administrator.");
	}

	return;
}
	


/**Validates the HTML form. This function is the springboard
 * for the lesser validation functions.
 */
function validateForm() {

	var valid = true;

	if (!validateField("firstname"))
		valid = false;

	if (!validateField("lastname"))
		valid = false;

	if (!checkPasswords())
		valid = false;

	if (!checkEmail())
		valid = false;

	if (valid)
		submitForm();

	// Return false to make sure the HTML doesn't try submitting anything.
	// Submission should happen via javascript.
	return false;
}

/**Checks to see whether the field specified by fieldName is empty.
 * If it is, it sets the error of that field to visible
 */
function validateField(fieldName) {
    
    var err = document.getElementById(fieldName+"-error");
    var val = document.getElementById(fieldName).value;
    err.style.visibility = "hidden";
    
    if (val == "") {
        err.style.visibility = "visible";
        return false;
    }
    else {
        err.style.visibility = "hidden";
        return true;
    }
}

/**Checks passwords for the following:
 * - Length (6 chars at least)
 * - Matching
 * - Empty String
 */
function checkPasswords() {
	var err = document.getElementById("password-error");
   	var val = document.getElementById("password").value;
	
	var valid = true;
	err.style.visibility = "hidden";
	
    if (val == "") {
		valid = false;
    	}
	else if (val.length < 6) {
		err.innerHTML = "Password must be at least 6 characters";
		valid = false;
	}
	else if (document.getElementById("password2").value != val) {
		err.innerHTML = "Passwords must match";
		valid = false;
	}

	if (!valid)
		err.style.visibility = "visible";

	return valid;

}

/** Uses regex to check whether the email address provided
 * follows the expected format of email addresses.
 */
function checkEmail() {

    var emailreg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    var val = document.getElementById("email").value;
	var err = document.getElementById("email-error");	
	
	err.style.visibility = "hidden";

	var valid = true;

    	if (val == "")
        	valid = false;
    	else if (!emailreg.test(val)) {
        	err.innerHTML = "Invalid Email";
        	valid = false;
    	}

	if (!valid)
	        err.style.visibility = "visible";

	return valid;

}
