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

/**Submit the login info via an HTTP POST request to the server-side
 * PHP script. The parameters of the form are passed, along with 
 * a querytype which will tell the PHP which MySql command to
 * execute.
 */
function checkCredentials() {

    	var dat=$("form").serialize();

        $.ajax({type:"POST",
		url:"mcsa_checkin.php",
        data: dat+"&query_id=login",
        success: 
			function(html){
							if (html == "") 
								alert("return data is null.");
							processResponse(html);
							//alert(html);
						  }
        });

}


/**Processes the response from the PHP script. 
 * If the request was successful, and the user has an approved account,
 *  the user_id and firstname are added to local storage.
 * If the user's account hasn't been approved or doesn't exist, the 
 *  user is informed as such.
 * Otherwise, an error messafe is thrown.
 */ 
function processResponse(html) {
	
	var jsonData = $.parseJSON(html);
	
	if (jsonData.status == 1) {
		var user_id = jsonData.data[0].user_id;
		var firstname = jsonData.data[0].firstname;
		var approved = jsonData.data[0].approved;

		if (user_id == "" || user_id == null ||  firstname == "" || firstname == null) {
			alert("Error in parsing return data: " + html);
			return;
		}

		if (!approved) {
			$("#pendingapproval").html("This account is still pending approval.");
			return;
		}

		localStorage["mcsa_checkin_userid"] = user_id;
		localStorage["mcsa_checkin_firstname"] = firstname;		
		window.location = "checkin.html";
	}
	else if (jsonData.status == -1) {
		
		if (jsonData.errorText == "No such user") {
			var val = document.getElementById("email").value;	
			var err = document.getElementById("email-error");	
			err.innerHTML = "Invalid email/password combination";
			err.style.visibility = "visible";
			return;
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
function validateLogin() {

	var valid = true;

	if (!validateField("password"))
		valid = false;

	if (!validateField("email"))
		valid = false;

	if (valid)
		checkCredentials();

	return false;

}

/**Checks to see whether the field specified by fieldName is empty.
 * If it is, it sets the error of that field to visible
 */
function validateField(fieldName) {
    
    // could use jQuery here. Didn't really look into how.
    var err = document.getElementById(fieldName+"-error");
    var val = document.getElementById(fieldName).value;
    
    err.style.visibility = "hidden";
	err.innerHTML = "";
	
    if (val == "") {
		err.innerHTML = "Field cannot be empty";
        err.style.visibility = "visible";
        return false;
    }
    else {
        return true;
    }
}
