/* Monitoring the server status and rebooting functionality */

rebooting_span = document.getElementById("rebooting");
good_to_go_span = document.getElementById("good-to-go");
restart_button = document.getElementById("restart");
restart_button.onclick = reboot;
set_machine_status(false);

bad_connection_strikes = 0;
bad_connection_max_strikes = 3;

connection_status = ["alive", "acquiring", "rebooting"][1];

function test_aliveness() {
  $.ajax({
    type: "GET",
    url: server_url + ":" + server_port + "/connection_status",
    async: true,
    success: function(text, textStatus, xhr) {
      response = JSON.parse(text)
      connection_alive = response.alive

      if (connection_status == "acquiring") {
        read_state_acquiring(connection_alive);
      } else if (connection_status == "alive") {
        read_state_alive(connection_alive);
      } else {
        read_state_rebooting(connection_alive);
      }
      set_machine_status(connection_alive);
    },
    error: function(xhr, textStatus, errorThrown){
      connection_alive = false;
      if (connection_status == "acquiring") {
        read_state_acquiring(connection_alive);
      } else if (connection_status == "alive") {
        read_state_alive(connection_alive);
      } else {
        read_state_rebooting(connection_alive);
      }
      set_machine_status(connection_alive);
    }
  });
}

function read_state_acquiring(connection_alive) {
  if (connection_alive) {
    revive_connection_state()
  } else {
    connection_status = "rebooting"
  }
}

function read_state_alive(connection_alive) {
  if (connection_alive) {
    //
  } else {
    possible_reboot();
  }
}

function read_state_rebooting(connection_alive) {
  if (connection_alive) {
    revive_connection_state();
  } else {
    //
  }
}

function possible_reboot() {
  bad_connection_strikes += 1;
  if (bad_connection_strikes => bad_connection_max_strikes) {
    connection_status = "rebooting";
    //reboot();
  }
}

function revive_connection_state() {
  connection_status = "alive";
  bad_connection_strikes = 0;
}

function hide_element(elem) {
  elem.classList.add('hide');
}

function show_element(elem) {
  elem.classList.remove('hide');
}

function set_machine_status(ready) {
  if (ready) {
    hide_element(rebooting_span)
    show_element(good_to_go_span)
  } else {
    hide_element(good_to_go_span)
    show_element(rebooting_span)
  }
}

function reboot() {
  set_machine_status(false);
  send_request("restart", null, process_restart_response);
}

function process_restart_response(text) {
  set_machine_status(JSON.parse(text).alive);
}
