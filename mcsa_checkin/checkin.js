/**
 *  The jQuery function that is run when the document is first
 *  loaded. Should be used to check essentials, such as whether
 *  the user is logged in, etc.
 */
$(document).ready(function() {
	//getCheckins();
	//alert("blah");
	checkLoggedIn();
	getLocations();
});

/**
 * Logs the user out by removing items from localStorage.
 */
function logOut() {
	
	localStorage.removeItem("mcsa_checkin_userid");
	localStorage.removeItem("mcsa_checkin_firstname");
	//window.location = "login.html";

}


/**
 * Makes sure user is logged in. If not, takes them to the 
 * login page.
 */
function checkLoggedIn() {
	if (localStorage["mcsa_checkin_firstname"] == null || localStorage["mcsa_checkin_userid"] == null) {
		alert("You are not logged in");
		window.location = "login.html";
	}
}

/**
 * Gets the all loggable locations from the database by sending
 * a POST request to the PHP script.
 */
function getLocations() {

	$.ajax({type:"POST",
		url:"mcsa_checkin.php",
        	data: "query_id=locations",
                success: function(html){
			if (html == "") 
				alert("return data is null.");
			//alert(html);
			processLocations(html);
			}
                });

}

/**
 * Processes response to the request for locations. If 
 * the request is successful, the drop down menu is populated.
 * Otherwise, an error is thrown.
 */
function processLocations(html) {

	var jsonData = $.parseJSON(html);
	
	if (jsonData.status != 1) {
		$("body").html("Error loading page. Check your internet connection or contact an administrator.");
		return;
	}

	var locArr = jsonData.data;
	var locMenuString = "<option value=-1></option>";

	for (var i = 0; i < locArr.length; i++) {
	
		var tempString = "<option value="+locArr[i].location_id+">"+locArr[i].name+"</option>";
		locMenuString = locMenuString+tempString;

	}

	$("#locationsmenu").html(locMenuString);
	

}



function checkIn() {

	if ($("#locationsmenu").val() == -1) {
		$("#noselect").html("Please select a place to check in at.");
		$("#noselect").css("visibility", "visible");
		return false;
	}
	else {
		$("#noselect").html("");
		$("#noselect").css("visibility", "hidden");
	}
	
	
	var dat = $("form").serialize();
	//alert(dat);

	$.ajax({type:"POST",
		url:"mcsa_checkin.php",
        	data: "query_id=checkin&"+dat+"&user_id="+localStorage["mcsa_checkin_userid"],
                success: function(html){
			if (html == "") 
				alert("return data is null.");
//				alert(html);
				checkInsertSuccess(html);
			}
                });

	return false;
}

function checkInsertSuccess(html) {

	var jsonData = $.parseJSON(html);
	
	if (jsonData.status == 1) {
		window.location = "viewcheckins.html";
	}
	else 
		alert("error in server response: " + html);

}




