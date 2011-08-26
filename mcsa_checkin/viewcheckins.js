var map;
var markersArray = [];
var currInfowindow = null;


/**
 *  The jQuery function that is run when the document is first
 *  loaded. Should be used to check essentials, such as whether
 *  the user is logged in, etc.
 */
$(document).ready(function() {
	checkLoggedIn();
	//getCheckinsList();
	loadMap();
	getLocations();
});

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
 * Logs the user out by removing items from localStorage.
 */
function logOut() {
	
	localStorage.removeItem("mcsa_checkin_userid");
	localStorage.removeItem("mcsa_checkin_firstname");
	//window.location = "login.html";

}
/**
 * For list view - makes an AJAX request for a list of all checkins.
 * TODO: Once the app is in use, fix to return recent checkins within
 * a certain time limit.
 */
function getCheckinsList() {

	$.ajax({type:"POST",
		url:"mcsa_checkin.php",
        	data: "query_id=checkinsList",
                success: function(html){
			if (html == "") 
				alert("return data is null.");
			//alert(html);
			var jsonData = processOutput(html);
			if (jsonData != null)
				displayCheckinText(jsonData);
			}
                });

}
/**
 * Converts the JSON returned by the PHP into a readable array
 */
function processOutput(html) {

	var jsonData = $.parseJSON(html);
	
	if (jsonData.status != 1) {
		$("body").html("Error loading page. Check your internet connection or contact an administrator.");
		return null;
	}

	return jsonData;

}

/**
 * Clears out the map div, and writes out the HTML for the list view.
 * The clearing out is done instead of a display/hide so that a refresh
 * takes place the next time the map is loaded. Parameter is the formatted
 * JSONdata.
 */
function displayCheckinText(jsonData) {

	// clear out map div;
	$("#map").html("");
	$("#switch").html("<div id='switch' style='font-size: 12px;' align='right'><a href='#' onclick='loadMap();'>Switch to Map View</a></div>");

	var checkinArr = jsonData.data;
	var checkinStr = "";

	for (var i = 0; i < checkinArr.length; i++) {

		var tempString = "<p><b>"+checkinArr[i].firstname+"</b> checked in at <b>"+checkinArr[i].location_name+"</b> at <b>"+checkinArr[i].time+"</b> on "+checkinArr[i].date+".</p>";
		checkinStr = checkinStr+tempString;

	}
	
	checkinStr = checkinStr+"<br>";

	$("#checkintxt").html(checkinStr);

}

/**
 * Gets a list of all locations, which are then used to load the markers
 * for the map view. Locations contain all required data, including 
 * whether a location has a checkin, and if so, the details of that 
 * checkin.
 */
function getLocations() {

	$.ajax({type:"POST",
		url:"mcsa_checkin.php",
        	data: "query_id=mapLocations",
                success: function(html){
			if (html == "") 
				alert("return data is null.");
			//alert(html);
			var jsonData = processOutput(html);
			if (jsonData != null)
				loadMarkers(jsonData);
			}
                });

}

/**
 * Clears checkin list, and then loads the Google Map by writing
 * out any HTML and doing any necessary JS processing. When done, 
 * it sends out a request for a list of locations so that markers can
 * be created
 */
function loadMap() {

	// clear checkin text
	$("#checkintxt").html("");
	$("#switch").html("<div id='switch' style='font-size: 12px;' align='right'><a href='#' onclick='getCheckinsList();'>Switch to List View</a></div>");

	$("#map").html("<div id=\"map_canvas\"></div>");

    var latlng = new google.maps.LatLng(42.05498075047313, -87.67717480659485);
    var myOptions = {
    	  	zoom: 15,
		minZoom: 15,	
		maxZoom: 17,
      		center: latlng,
 		mapTypeId: google.maps.MapTypeId.ROADMAP,
  	    
    	};

    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    
    getLocations();

}

/**
 * Confirms that the user wishes to checkin somewhere. If yes, sends
 * an AJAX request to the backend PHP.
 */
function checkIn(location_id, location_name) {
	
	if (!confirm("You are going to check in at " + location_name + ". Is that fine?")) {
		return;
	}

	$.ajax({type:"POST",
		url:"mcsa_checkin.php",
        	data: "query_id=checkin&locationsmenu="+location_id+"&user_id="+localStorage["mcsa_checkin_userid"],
                success: function(html){
			if (html == "") 
				alert("return data is null.");
//				alert(html);
				checkInsertSuccess(html);
			}
          });
}

/**
 * Checks response to make sure checkin happened. If it did, refreshes
 * page.
 */
function checkInsertSuccess(html) {

	var jsonData = $.parseJSON(html);
	
	if (jsonData.status == 1) {
		window.location = "viewcheckins.html";
	}
	else 
		alert("error in server response: " + html);

}
/**
 * Creates the text for the infowindows of all the markers. Then, creates
 * the markers and infowindows themselves by calling a helper function.
 */
function loadMarkers(jsonData) {
	
	var locArr = jsonData.data;
	var markersTextArr = [];
	
	for (var i = 0; i < locArr.length; i++) {
	
		var marker;
		var tempString;

		if (locArr[i].hasCheckin) {
			tempString = "<div class='markertxt' style='min-width: 270px;'> - <b>"+locArr[i].firstname+"</b> checked in at <b>"+locArr[i].time+"</b> on "+locArr[i].date+"</div>";
		}
		else {
			tempString = "<div class='markertxt'>Nobody's checked in at "+locArr[i].location_name+". Are you here? Check in now!</div>";
		}

		if (markersTextArr[locArr[i].location_name] == null) {
			markersTextArr[locArr[i].location_name] = { text: "<div class='markerhead'><b>"+locArr[i].location_name+"</b></div>"+tempString,
															 location: locArr[i]};
		}
		else {
			markersTextArr[locArr[i].location_name].text += tempString;			
		}
		//createWindow(marker,locArr[i]);	
	}
	
	markersArray = [];
	
	for (var name in markersTextArr) {
		if (markersTextArr[name].location.hasCheckin) {
			markersTextArr[name].text += "<br><table style='width: 100%;'><tr style='-moz-available'>";
			markersTextArr[name].text += "<td><div class='markertxt'>Are you also at "+markersTextArr[name].location.location_name+"?</div></td>";
			markersTextArr[name].text += "<td align=right><input type='button' id='submit' value='Check In!' onclick='checkIn("+markersTextArr[name].location.location_id+",\""+name+"\");'></td>";
			markersTextArr[name].text += "</tr><table>";
		}
		else {
			markersTextArr[name].text += "<div style='width: auto; text-align: right'><input type='button' id='submit' value='Check In!' onclick='checkIn("+markersTextArr[name].location.location_id+",\""+name+"\");'></div>";
		}
		createWindow(markersTextArr[name]);
	}
	
}

/**
 * Function that creates the markers and the infowindows for those
 * markers.
 */
function createWindow(markerTextData) {

		var locData = markerTextData.location;
		var locText = markerTextData.text;
		var marker;
		
		if (markerTextData.location.hasCheckin) {
			marker = new google.maps.Marker({
				position: new google.maps.LatLng(locData["latitude"], locData["longitude"]),
				map: map,
				icon: "http://www.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png"
			});
		}
		else {
			marker = new google.maps.Marker({
				position: new google.maps.LatLng(locData["latitude"], locData["longitude"]),
				map: map,
				icon: "http://www.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png"
			});
		}
							
		var infowindow = new google.maps.InfoWindow({
			content: locText,
			maxWidth: 270
		});

		google.maps.event.addListener(marker, 'click', function() {openInfowindow(infowindow, marker)});
		
		markersArray[locData.location_name] = marker;
		markersArray[locData.location_name].infowindow = infowindow;
			
}

/**
 * Opens an infowindow once the markers are clicked
 */
function openInfowindow(infowindow, marker) {
	if (currInfowindow != null)
		currInfowindow.close();
				
	infowindow.open(map,marker);
				
	currInfowindow = infowindow;
}
