<?php

header('Cache-Control: no-cache, must-revalidate');

$debug  = false;

if ($debug) {
	println("Starting PHP script");
	println("Initializing db connection");
}

$db_handle = mysql_connect("localhost","root","madareman");

if (!$db_handle)
	die(mysql_error());

if ($debug)
	println("Connection initialized");

$database = "mcsa_checkin_app";
@mysql_select_db($database) or die(mysql_error());

if ($debug) 
	println("Selected database: ".$database);


if ($_POST['query_id'] == "register") {
	registerNewUser();
}
else if ($_POST['query_id'] == "login") {
	checkLogin();
}
else if ($_POST['query_id'] == "locations") {
	getLocations();
}
else if ($_POST['query_id'] == "checkin") {
	checkin();
}
else if ($_POST['query_id'] == "checkinsList") {
	getCheckinsList();
}
else if ($_POST['query_id'] == "mapLocations") {
	getLocationsForMap();
}

mysql_close();

if ($debug)
	println("Closed Database");



/*
 * 
 * ===================================================================
 * FUNCTIONS START HERE:
 * ===================================================================
 * 
 */


function getLocationsForMap() {
	
	global $debug;
	
	// --- EMPTY LOCS --- //
	
	// haphazardly constructed, might not be efficient
	$emptyLocationsQuery = "select l.location_id, l.name as location_name, l.latitude, l.longitude from locations_table as l where l.location_id not in (SELECT distinct c.location_id FROM checkin_table AS c JOIN (SELECT user_id,MAX(`timestamp`) AS `timestamp` FROM checkin_table GROUP BY user_id) AS x ON (x.user_id = c.user_id AND x.`timestamp`=c.`timestamp`));";

	if ($debug) 
		println("Executing query: ".$emptyLocationsQuery);

	$response = mysql_query($emptyLocationsQuery) or 
		die(formatErrorMsg(mysql_error()));

	$dataArr; $count = 0;
	while ($r = mysql_fetch_assoc($response)) {
		$r['hasCheckin'] = false;
		$dataArr[$count++] = $r;
	}

	// --- CHECKED IN LOCS --- //
	
	$checkedInLocationsQuery = "SELECT c.checkin_id, u.firstname, l.location_id, l.name as location_name, l.latitude, l.longitude,  date_format(c.timestamp, '%a, %b %e') as date, date_format(c.timestamp, '%h:%i%p') as time FROM checkin_table AS c JOIN ( select user_id, MAX(timestamp) as timestamp from checkin_table group by user_id ) as x on (x.user_id = c.user_id and x.timestamp = c.timestamp) join locations_table as l on (c.location_id = l.location_id) join (select firstname, user_id from users_table) as u where (u.user_id = c.user_id) order by location_name";

	if ($debug) 
		println("Executing query: ".$checkedInLocationsQuery);

	$response = mysql_query($checkedInLocationsQuery) or 
		die(formatErrorMsg(mysql_error()));

	while ($r = mysql_fetch_assoc($response)) {
		$r['hasCheckin'] = true;
		$dataArr[$count++] = $r;
	}
	
	// --- MUTUAL STUFF --- //
	
	$resultArr['status'] = 1;
	$resultArr['data'] = $dataArr;
	
	//print_r($resultArr);

	echo json_encode($resultArr);
	
}

/**
 * Gets and returns a list containing the most recent checkin
 * by each person in the users database. Will eventually have a cut-off
 * point.
 */
function getCheckinsList() {
	
	global $debug;
	
	$checkinsListQuery = "SELECT c.checkin_id, u.firstname, l.location_id, l.name as location_name, date_format(c.timestamp, '%a, %b %e') as date, date_format(c.timestamp, '%h:%i%p') as time FROM checkin_table AS c JOIN ( select user_id, MAX(timestamp) as timestamp from checkin_table group by user_id ) as x on (x.user_id = c.user_id and x.timestamp = c.timestamp) join (select name, location_id from locations_table) as l on (c.location_id = l.location_id) join (select firstname, user_id from users_table) as u where (u.user_id = c.user_id) order by c.timestamp desc";
	

	if ($debug) 
		println("Executing query: ".$checkinsListQuery);

	$result = mysql_query($checkinsListQuery) or 
		die(formatErrorMsg(mysql_error()));

	echo ($result);
}

/**
 * Inserts a checkin into a checkin table, using the user_id and 
 * location_id. location_id comes from locationsmenu. 
 */
function checkin() {
	
	global $debug;
	
	$checkinQuery = "INSERT INTO checkin_table VALUES('','".$_POST['user_id']."','".$_POST['locationsmenu']."',null)";
	
	if ($debug) 
		println("Executing query: ".$checkinQuery);

	mysql_query($checkinQuery) or 
		die(formatErrorMsg(mysql_error()));


	echo formatSuccessReponse(null);
}

/*
 * Gets and returns a list of all locations in the locations table.
 */
function getLocations() {
	
	global $debug;
	
	$locationsQuery = "SELECT * FROM locations_table";
	
	if ($debug) 
		println("Executing query: ".$locationsQuery);

	$result = mysql_query($locationsQuery) or 
		die(formatErrorMsg(mysql_error()));

	echo formatSuccessReponse($result);
	
}

/*
 * Checks to see whether a user with the provided login credentials
 * exists in the database. If he does, it returns the user_id,
 * firstname and authorization. If there's no such user, returns an
 * error message. 
 */
function checkLogin() {
	
	global $debug;
	
	$loginQuery = "SELECT firstname, user_id, approved FROM users_table WHERE email = '".$_POST['email']."' and password='".$_POST['password']."'";
	//$loginQuery = "SELECT * FROM users_table WHERE email = 'hebz@gmail.com' and password='boo'";

	if ($debug) 
		println("Executing query: ".$loginQuery);

	$result = mysql_query($loginQuery) or 
		die(formatErrorMsg(mysql_error()));
		
	if (mysql_num_rows($result) < 1)
		die(formatErrorMsg("No such user"));


	echo formatSuccessReponse($result);
}


/* Registers a new user in the MySQL database.
 */
function registerNewUser () {
	
	global $debug;
	
	if (userDoesExist())
		die(formatErrorMsg("Email Taken"));

	//$insertNewUserQuery = "INSERT INTO users_table VALUES ('','pass','fname','lname',null,'email',0)";
	$insertNewUserQuery = "INSERT INTO users_table VALUES ('','".$_POST['password']."','".$_POST['firstname']."','".$_POST['lastname']."',null,'".$_POST['email']."',0)";
	
	if ($debug) 
		println("Executing query: ".$insertNewUserQuery);

	mysql_query($insertNewUserQuery) 
		or die(formatErrorMsg(mysql_error()));

	// get user_id of newly created user
	$userId = mysql_query("SELECT user_id FROM users_table WHERE email = '".$_POST['email']."'") 
		or die(formatErrorMsg(mysql_error()));
	
	echo formatSuccessReponse($userId);
}

/* Checks to see if the user exists.
 * If not, returns false.
 */
function userDoesExist() {
	
	global $debug;
	
	$checkEmailExistsQuery = "SELECT user_id FROM users_table WHERE email = '".$_POST['email']."'";
	
	if ($debug) 
		println("Executing query: ".$checkEmailExistsQuery);
	
	$userId = mysql_query($checkEmailExistsQuery);

	// check to see if address is registered. If it is, return true.
	if (mysql_num_rows($userId) > 0)
		return true; 
	
}

/* Formats a successful response.
 * Returns successful response.
 */
function formatSuccessReponse($response) {
	
	if ($response == null)  {
		$resultArr['status'] = 1;
		return json_encode($resultArr);
	}
	
	$dataArr; $count = 0;
	while ($r = mysql_fetch_assoc($response)) {
		$dataArr[$count++] = $r;
	}
	
	$resultArr['status'] = 1;
	$resultArr['data'] = $dataArr;
	
	//print_r($resultArr);

	return json_encode($resultArr);
	
}

/* Formats error message.
 * Returns formatter message.
 */
function formatErrorMsg($errorString) {
	$errorArr['status'] = -1;
	$errorArr['errorText'] = $errorString;
	return json_encode($errorArr);
}

/* Formats the debug output messages
 */
function println($msg) {
	echo "-> ".$msg."<br>"; 
}

/*
 * 
 * ===================================================================
 * FUNCTIONS END HERE:
 * ===================================================================
 * 
 */

?>



