/* Core methods used by all other modules */

server_url = "http://130.37.198.98"
server_port = "80"

function send_request(path, data, callback) {
  $.ajax({
    type: "GET",
    data: data,
    url: server_url + ":" + server_port + "/" + path,
  }).done(callback);
}

function make_icon(selector) {
  var icon = document.createElement("i");
  $(icon).addClass(selector).addClass("fa");
  return icon;
}

function list_contains_substring(list, string) {
  for (var i = 0; i < list.length; i++) {
    if (string.indexOf(list[i]) >= 0) {
      return true;
    }
  }
  return false;
}
