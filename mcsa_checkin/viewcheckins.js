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

function processOutput(html) {

	var jsonData = $.parseJSON(html);
	
	if (jsonData.status != 1) {
		$("body").html("Error loading page. Check your internet connection or contact an administrator.");
		return null;
	}

	return jsonData;

}

function displayCheckinText(jsonData) {

	// clear out map div;
	$("#map").html("");

	var checkinArr = jsonData.data;
	var checkinStr = "";

	for (var i = 0; i < checkinArr.length; i++) {

		var tempString = "<p><b>"+checkinArr[i].firstname+"</b> checked in at <b>"+checkinArr[i].location_name+"</b> at <b>"+checkinArr[i].time+"</b> on "+checkinArr[i].date+".</p>";
		checkinStr = checkinStr+tempString;

	}
	
	checkinStr = checkinStr+"<br>";

	$("#checkintxt").html(checkinStr);

}


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

function loadMap() {

	// clear checkin text
	$("#checkintxt").html("");

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

}

function loadMarkers(jsonData) {
	
	var locArr = jsonData.data;
	
	for (var i = 0; i < locArr.length; i++) {
	
		var marker;
	
		if (locArr[i].hasCheckin) {
			marker = new google.maps.Marker({
				position: new google.maps.LatLng(locArr[i]["latitude"], locArr[i]["longitude"]),
				map: map,
				icon: "http://www.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png"
			});
		}
		else {
			marker = new google.maps.Marker({
				position: new google.maps.LatLng(locArr[i]["latitude"], locArr[i]["longitude"]),
				map: map,
				icon: "http://www.google.com/intl/en_us/mapfiles/ms/micons/red-dot.png"
			});
		}
		createWindow(marker,locArr[i]);	
	}
	addAllWindows();
}

function addAllWindows() {
	
	for (obj in markersArray) {
		var infowindow = markersArray[obj].infowindow;
		var marker = markersArray[obj];
		
		infowindow['content'] = infowindow['content'];
		
		addAWindow(marker, infowindow);
	}
}

function addAWindow(marker, infowindow) {
	google.maps.event.addListener(marker, 'click', function() {openInfowindow(infowindow, marker)});
}

function createWindow(marker, locData) {
		
		var tempString;
		if (locData.hasCheckin)
			tempString = "<div class='markertxt'> - <b>"+locData.firstname+"</b> checked in at <b>"+locData.time+"</b> on "+locData.date+".</div>";	
		else
			tempString = "<div class='markertxt'>Nobody's checked in at "+locData.location_name+". Are you here? Check in now!</div>";
		
		if (markersArray[locData.location_name] == null) 
		{
			
			var infowindow = new google.maps.InfoWindow({
				content: "<div class='markerhead'><b>"+locData.location_name+"</b></div>"+tempString,
				maxWidth: 270
			});

			//google.maps.event.addListener(marker, 'click', function() {openInfowindow(infowindow, marker)});
			
			markersArray[locData.location_name] = marker;
			markersArray[locData.location_name].infowindow = infowindow;
			/*
			var infowindow = markersArray[locData.location_name].infowindow;
			infowindow['content'] = infowindow['content'] + tempString;
			*/	
		}		
		else {
			var infowindow = markersArray[locData.location_name].infowindow;
			infowindow['content'] = infowindow['content'] + tempString;
		}		
	
}

function openInfowindow(infowindow, marker) {
	if (currInfowindow != null)
		currInfowindow.close();
				
	infowindow.open(map,marker);
				
	currInfowindow = infowindow;
}
