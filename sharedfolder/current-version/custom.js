
test_aliveness()
window.setInterval(test_aliveness, 5000);

// initialize shadowdom
var tree_shadow_dom = null;
var tree_anchor = document.getElementById("peek_tree");


send_request("tree", {"path": "/peek", "maxdepth": 1}, function (res) {
    json = JSON.parse(res)[0]

    var prefix = "";
    var full_path = "";
    json = fix_json(json, prefix);

    tree_shadow_dom = build_list(json, full_path);
    add_tree_event_handlers(tree_shadow_dom, tree_anchor, tree_shadow_dom);
    tree_anchor.append(tree_shadow_dom);
    //render_shadow_dom(tree_anchor, tree_shadow_dom);
});



/*=======================================================
 *           Functions
 *=======================================================
 */

// Function: Rescan peek
var button_func_rescan = document.getElementById("func_rescan");
$(button_func_rescan).click(function(e) {
    send_request("tree", {"path": "/peek", "maxdepth": 1}, function (res) {
        json = JSON.parse(res)[0]

        var prefix = "";
        var full_path = "";
        json = fix_json(json, prefix);

        tree_shadow_dom = build_list(json, full_path);
        add_tree_event_handlers(tree_shadow_dom, tree_anchor, tree_shadow_dom);
        tree_anchor.removeChild(tree_anchor.children[0]);
        tree_anchor.append(tree_shadow_dom);
        //render_shadow_dom(tree_anchor, tree_shadow_dom);
    });
});

// Function: Crash VM
var button_func_crash = document.getElementById("func_crash");
$(button_func_crash).click(function(e) {
    send_request("crash_server", null, function(res) {
        // Nothing to be done here
    });
});

// Function: Kill running trees
var button_func_kill_trees = document.getElementById("func_kill_trees");
$(button_func_kill_trees).click(function(e) {
    send_request("kill_running_trees", null, function(res) {
        // Nothing to be done here
    });
});


// Function: Take snapshot
var button_func_take_snapshot = document.getElementById("func_take_snapshot");
console.log($(button_func_take_snapshot));
$(button_func_take_snapshot).click(function(e) {
    var selections = $(tree_anchor).find(".selected");

    if (selections.length > 1 || selections.length == 0) {
        alert("Snapshot can only be taken of one device at a time");
        return;
    }

    var dev_name = selections.find("span").first().text();
    send_request("snapshot", {"dev_name": dev_name}, function(res) {
        console.log("snapshot res", res);
        alert("snapshot taken, refresh devices to retrieve");
    });

});

/*=======================================================
 *           Filters
 *=======================================================
 */
var filter_chain = {
    active_filters: new Map(),
    add_filter: function(filter_name, filter, tree_anchor) {
        this.active_filters.set(filter_name, filter);
    },
    remove_filter: function(filter_name, filter, tree_anchor) {
        if (this.active_filters.has(filter_name)) {
            this.active_filters.get(filter_name).reset(tree_anchor);
            this.active_filters.delete(filter_name);
        }
    },
    toggle_filter: function(filter_name, filter, tree_anchor) {
        console.log("Toggle filter");
        if (this.active_filters.has(filter_name)) {
            this.remove_filter(filter_name, filter, tree_anchor);
            console.log("removed filter!");
        } else {
            this.active_filters.set(filter_name, filter);
        }
    },
    render: function(tree_anchor) {
        // reset all filters
        for (var [name, filter] of this.active_filters) {
            filter.reset(tree_anchor);
        }

        // find selected
        var $selected = $(tree_anchor).find(".selected");

        var filters = this.active_filters;
        // Iterate over selections
        for (var i = 0; i < $selected.length; i++) {
            tree_recurse($selected[i], function(elem, is_leaf) {
                // Iterate over filters in chain
                var results = [];

                for (var [name, filter] of filters) {
                    results.push(filter.render(elem, is_leaf));
                }

                return results.includes(true);
            })
        }

    },
    refresh: function(tree_anchor) {
        // Refresh all registered filters
        // Fetch active selections
        var $selected = $(tree_anchor).find(".selected");

        for (var [name, filter] of this.active_filters) {
            filter.refresh($selected);
        }
    }
}

var filter_funcpurple = {
    refresh: function($selected) {
        // Nothing to be done here.
    },
    render: function(elem, is_leaf) {
        if (elem.dataset.path.includes("__func__")) {
            $(elem).addClass("filter_funcpurple");
            return true;
        }
    },
    reset: function(tree_anchor) {
        $(tree_anchor).find(".filter_funcpurple").removeClass("filter_funcpurple");
    }
}

var filter_danglingptr = {
    tree_anchor: tree_anchor,
    file_list: new Set(),
    refresh: function($selected) {
        if ($selected.length > 1) {
            alert("Dangling pointer filter currently only works on one selection at a time");
            filter_chain.toggle_filter("filter_funcpurple", this, this.tree_anchor);
        } else {
            var path = $selected[0].dataset.path;
            console.log("Filter request: filter_danglingptr", "path:", path);
            var self = this;
            send_request("dangling_pointers", {"dev_path": path}, function(res) {
                json = JSON.parse(res);
                console.log(json);
                self.file_list = new Set(json['LtR']);
                filter_chain.render(self.tree_anchor);
            });

        }
    },
    render: function(elem, is_leaf) {
        if (filter_danglingptr.file_list.has(elem.dataset.path)) {
            $(elem).addClass("filter_danglingptr");
        }
    },
    reset: function(tree_anchor) {
        $(tree_anchor).find(".filter_danglingptr").removeClass("filter_danglingptr");
    }
}

var filter_memleak = {
    tree_anchor: tree_anchor,
    file_list: new Set(),
    refresh: function($selected) {
        if ($selected.length != 1) {
            alert("Memleak filter currently only works on one selection at a time");
            filter_chain.toggle_filter("filter_memleak", this, this.tree_anchor);
        } else {
            var path = $selected[0].dataset.path;
            console.log("Filter request: filter_memleak", "path:", path);
            var self = this;
            send_request("memleaks", {"dev_path": path}, function(res) {
                json = JSON.parse(res);
                console.log(json);
                self.file_list = new Set(json['LtR']);
                filter_chain.render(self.tree_anchor);
            });
        }
    },
    render: function(elem, is_leaf) {
        if (!is_leaf && $(elem).find(".filter_memleak").length > 0) {
            $(elem).addClass("filter_memleak");
        }

        if (filter_memleak.file_list.has(elem.dataset.path)) {
            $(elem).addClass("filter_memleak");
            console.log(elem);
            return true;
        }
    },
    reset: function(tree_anchor) {
        $(tree_anchor).find(".filter_memleak").removeClass("filter_memleak");
    }
}

var filter_diff = {
  tree_anchor: tree_anchor,
  file_list1: new Set(),
  file_list2: new Set(),
  refresh: function($selected) {
    if ($selected.length != 2) {
      console.log($selected);
      alert("Diff filter requires exactly two /peek subdirectories to be selected");
      filter_chain.toggle_filter("filter_diff", this, this.diff_anchor);
    } else {
      var sorted = $selected.sort()
      var path1 = sorted[0].dataset.path;
      var path2 = sorted[1].dataset.path;

      console.log("Filter request: filter_diff", "path1:", path1, "path2:", path2);
      var self = this;
      send_request("diff", {"dev_path1": path1, "dev_path2": path2}, function (res) {
        json = JSON.parse(res)
        console.log(json);
        self.file_list1 = new Set(json["LtR"]);
        self.file_list2 = new Set(json["RtL"]);
        console.log("file_list1:", self.file_list1);
        console.log("file_list2:", self.file_list2);
        //filter_chain.render(self.tree_anchor);
        add_diff_bullet(path1, path2, self.file_list1, self.file_list2);
      });
    }
  },
  render: function(elem, is_leaf) {


    /*
    if (filter_diff.file_list1.has(elem.dataset.path)) {
      $(elem).addClass("filter_diff_LtR");
    } else {
      //console.log("TODO: add 'missing' element to other tree:", elem);
    }
    if (filter_diff.file_list2.has(elem.dataset.path)) {
      $(elem).addClass("filter_diff_RtL");
    } else {
      //console.log("TODO: add 'missing' element to other tree:", elem);
    }
    */
  },
  reset: function(diff_anchor) {
    $(diff_anchor).remove();
  }
}

var filter_regex = {
    regex: null,
    refresh: function($selected) {
    },
    render: function(elem, is_leaf) {
        // if regex is null, do nothing
        if (this.regex !== null) {
            if (!is_leaf && $(elem).find(".filter_regex").length > 0) {
                $(elem).addClass("filter_regex");
            }

            if (elem.dataset.path.match(this.regex)) {
                $(elem).addClass("filter_regex");
                return true;
            }
        }
    },
    reset: function(anchor) {
        console.log("clearing!");
        $(anchor).find(".filter_regex").removeClass("filter_regex");
    }
}


var text_filter_regex = document.getElementById("filter_regex");
var regex_key_timer = 0;
function trigger_filter() {
    var input_string = text_filter_regex.value;
    console.log("activating regex!", input_string);
    if (input_string == "") {
        filter_chain.remove_filter("filter_regex", filter_regex, tree_anchor);
        $(text_filter_regex).removeClass("filter-enabled");
        return
    }

    try {
        var re = new RegExp(input_string);
    } catch (e) {
        filter_chain.remove_filter("filter_regex", filter_regex, tree_anchor);
        $(text_filter_regex).removeClass("filter-enabled");
        return;
    }
    filter_regex.regex = re;
    // activate filter

    filter_regex.reset(tree_anchor);
    filter_chain.add_filter("filter_regex", filter_regex, tree_anchor);
    $(text_filter_regex).addClass("filter-enabled");
    filter_chain.render(tree_anchor);
}
$(text_filter_regex).keyup(function(e) {
    console.log("Keyup!!!")
    if (regex_key_timer) {
        clearTimeout(timer);
    }
    timer = setTimeout(trigger_filter, 700);
});

var button_filter_funcpurple = document.getElementById("filter_funcpurple");
$(button_filter_funcpurple).click(function (e) {
    filter_chain.toggle_filter("filter_funcpurple", filter_funcpurple, tree_anchor);
    filter_chain.render(tree_anchor);
    $(button_filter_funcpurple).toggleClass("filter-enabled");
});

var button_filter_memleak = document.getElementById("filter_memleak");
$(button_filter_memleak).click(function (e) {
    console.log("Adding memleak filter to filter chain");
    filter_chain.toggle_filter("filter_memleak", filter_memleak, tree_anchor);
    filter_chain.refresh(tree_anchor);
    $(button_filter_memleak).toggleClass("filter-enabled");
});

var button_filter_danglingptr = document.getElementById("filter_danglingptr");
$(button_filter_danglingptr).click(function (e) {
    console.log("Adding dangling ptr filter to filter chain");
    filter_chain.toggle_filter("filter_danglingptr", filter_danglingptr, tree_anchor);
    filter_chain.refresh(tree_anchor);
    $(button_filter_danglingptr).toggleClass("filter-enabled");
});


var button_filter_diff = document.getElementById("filter_diff");
$(button_filter_diff).click(function (e) {
  //console.log("Adding diff filter to filter chain");
  //filter_chain.toggle_filter("filter_diff", filter_diff, diff_anchor);
  //filter_chain.refresh(diff_anchor)
  if (!$(button_filter_diff).hasClass("filter-enabled")) {
    $selected = $(tree_anchor).find(".selected")
    filter_diff.refresh($selected);
  } else {
    filter_diff.reset(diff_bullet);
  }
  $(button_filter_diff).toggleClass("filter-enabled")
});

/*=======================================================
 *           Cat & Hexdump support
 *=======================================================
 */
var output_anchor = document.getElementById("output");
var open_file = null;

function cat_file_contents(filepath) {
    send_request("cat", {"path": filepath}, function(res) {
        output_anchor.innerHTML = res;
        open_file = filepath;
    })
}

function hexdump_file_contents(filepath) {
    send_request("hexdump", {"path": filepath}, function(res) {
        output_anchor.innerHTML = res;
        open_file = filepath;
    });
}

var button_select_cat = document.getElementById("button_select_cat");
$(button_select_cat).click(function (e) {
    cat_file_contents(LAST_CLICKED.parentElement.dataset.path);
});

var button_select_hex = document.getElementById("button_select_hex");
$(button_select_hex).click(function (e) {
    console.log("I've been clicked!!!");
    console.log(LAST_CLICKED.parentElement);
    hexdump_file_contents(LAST_CLICKED.parentElement.dataset.path);
});



/*=======================================================
 *           Peter's misc diff stuff (organize later)
 *=======================================================
 */

var diff_anchor = document.getElementById("diff_tree");
var diff_insertion_point = document.getElementById("diff_insertion_point");


var legend_strings = [
  "Present in PLACEHOLDERL but not PLACEHOLDERR",
  "Present in PLACEHOLDERR but not PLACEHOLDERL",
  "Present in both but different contents"
]


function union_copy(subtree1, subtree2) {
  var subtree_clone = $(subtree1).clone();
}







function assign_diff_classes(root_ul) {
  var this_level_class_set = new Set();
  var li_children = $(root_ul).children("li")
  for (var i = 0; i < li_children.length; i++) {

    var child_class_set = new Set();
    var li_elem = li_children[i];
    if ($(li_elem).hasClass("filter_diff_RtL")) child_class_set.add("filter_diff_RtL");
    if ($(li_elem).hasClass("filter_diff_LtR")) child_class_set.add("filter_diff_LtR");
    if ($(li_elem).hasClass("filter_diff_both")) child_class_set.add("filter_diff_both");

    var ul_children = $(li_elem).children("ul");

    for (var j = 0; j < ul_children.length; j++) {
      var new_ul = ul_children[j];
      child_class_set = child_class_set.union(assign_diff_classes(new_ul));
    }
    if (child_class_set.has("filter_diff_LtR") && child_class_set.has("filter_diff_RtL")) {
      child_class_set.add("filter_diff_both");
    }
    this_level_class_set = this_level_class_set.union(child_class_set);
    if (child_class_set.has("filter_diff_both")) {
      $(li_elem).addClass("filter_diff_both");
    } else if (child_class_set.has("filter_diff_LtR")) {
      $(li_elem).addClass("filter_diff_LtR");
    } else if (child_class_set.has("filter_diff_RtL")) {
      $(li_elem).addClass("filter_diff_RtL");
    }
  }
  return this_level_class_set;
}



function create_diff_bullet(dev_path1, dev_path2) {
  bullet = document.createElement("li");
  $(bullet).addClass("directory");
  $(bullet).addClass("expanded");
  bullet.id = "diff_bullet";
  diff_bullet = bullet
  var bullet_span = document.createElement("span");
  var span_text = document.createTextNode("diff");
  bullet.appendChild(bullet_span);
  var diff_icon = make_icon("fa-files-o");
  bullet_span.appendChild(diff_icon);
  bullet_span.appendChild(span_text);
  var inner_list = document.createElement("ul");
  bullet.appendChild(inner_list);
  inner_list.innerHTML = `
  <li>
    <span>
      Legend:
      </span>
  </li>
  <li class="filter_diff_LtR">
    <span>
      Present in PLACEHOLDERL but not PLACEHOLDERR
      </span>
  </li>
  <li class="filter_diff_RtL">
    <span>
      Present in PLACEHOLDERR but not PLACEHOLDERL
    </span>
  </li>
  <li class="filter_diff_both">
    <span>
      Present in both but different contents
    </span>
  </li>
  <li id="diff_insertion_point">
    <span>
      Results:
    </span>
    <ul>
    </ul>
  </li>`.replace(new RegExp("PLACEHOLDERL", 'g'), dev_path1).replace(new RegExp("PLACEHOLDERR", 'g'), dev_path2)

  tree_anchor.children[0].prepend(bullet);

}

function add_to_diff_tree(root_ul, parent_ul, full_path, applicable_path, path_til_now, strictly_LtR, strictly_RtL, both) {
  if (applicable_path == "") {
    return;
  }

  var applicable_path_split = applicable_path.split("/");
  var this_level_name = applicable_path_split[0];
  var remaining_path_name = applicable_path_split.slice(1).join("/");
  var next_level_name = applicable_path_split[1];

  potential_parent = $(root_ul).find("[data-diffpath='"+ path_til_now +"']");

  if (potential_parent.length == 0) {
    // no element exists to contain this one yet
    var ul_elem = document.createElement("ul");
    var li_elem = document.createElement("li");
    li_elem.dataset.diffpath = path_til_now;
    var span_elem = document.createElement("span");
    var icon = document.createElement("i");
    var text = document.createTextNode(this_level_name);
    if (remaining_path_name == "") { // TODO differentiate files & symlinks
      //$(icon).addClass("fa fa-question");
      $(icon).addClass("fa fa-file-o");
    } else {
      $(icon).addClass("fa fa-folder-open");
      $(li_elem).addClass("directory expanded");
    }
    span_elem.appendChild(icon)
    span_elem.appendChild(text)

    li_elem.appendChild(span_elem);

    parent_ul.appendChild(li_elem);


    li_elem.appendChild(ul_elem);

    if (strictly_RtL.has(path_til_now)) {
      $(li_elem).addClass("filter_diff_RtL");
    } else if (strictly_LtR.has(path_til_now)) {
      $(li_elem).addClass("filter_diff_LtR");
    } else if (both.has(path_til_now)) {
      $(li_elem).addClass("filter_diff_both");
    }
    add_to_diff_tree(root_ul, ul_elem, full_path, remaining_path_name, path_til_now + "/" + next_level_name, strictly_LtR, strictly_RtL, both);


  } else if (potential_parent.length == 1) {
    // an element exists to contain this one
    new_parent_li = potential_parent[0];
    new_parent_ul = new_parent_li.children[1];
    add_to_diff_tree(root_ul, new_parent_ul, full_path, remaining_path_name, path_til_now + "/" + next_level_name, strictly_LtR, strictly_RtL, both);
  } else {
    // I don't expect this to be reachable, but making debugging easier in case I overlooked something
    console.log("add_to_diff_tree problem:", path_split, potential_parent);
  }
}

function add_diff_bullet(dev_path1, dev_path2, LtR_set, RtL_set) {
  var all_diff_entries = Array.from(LtR_set.union(RtL_set)).sort();
  var strictly_LtR = LtR_set.difference(RtL_set);
  var strictly_RtL = RtL_set.difference(LtR_set);
  var both = LtR_set.intersection(RtL_set);
  console.log(strictly_LtR);
  console.log(strictly_RtL);
  console.log(both);
  create_diff_bullet(dev_path1, dev_path2);
  diff_insertion_point = document.getElementById("diff_insertion_point");
  var diff_root_ul = diff_insertion_point.children[1];
  for (i = 0; i < all_diff_entries.length; i++) {
    add_to_diff_tree(diff_root_ul, diff_root_ul, all_diff_entries[i], all_diff_entries[i], all_diff_entries[i].split("/")[0], strictly_LtR, strictly_RtL, both);
  }
  assign_diff_classes(diff_root_ul)
  add_tree_event_handlers(diff_root_ul, null, null)
  $("#diff_bullet").children("span").click(function(e) {
      e.stopPropagation();
      var span_elem = e.target
      var parent_li_elem = e.target.parentElement
      toggle_expanded_status(parent_li_elem);
  });
}


 /*

var top_level_dirs = new Set(all_diff_entries.map(elem => elem.split("/")[0]))
var max_dir_depth = max(all_diff_entries.map(elem => count_occurrences_in_string(elem, "/")))

var entries_by_level = new Array();
for (i = 0; i < all_diff_entries.length; i++) {
  entry = all_diff_entries[i];
  depth = count_occurrences_in_string(entry, "/");
  if (!entries_by_level[depth]) {
    entries_by_level[depth] = new Array();
  }
  entries_by_level[depth].push(entry);
}
*/
