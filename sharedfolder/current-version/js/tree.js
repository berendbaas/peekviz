/* File tree functionality */

//SERVICE_BLACKLIST = ["/peek/vm", "/peek/inet"]
SERVICE_BLACKLIST = ["/peek/vm"]
SERVER_REQUEST_BUSY = false;
LAST_CLICKED = null;

function getList(item, full_path) {
    if (full_path != "") {
        full_path += "/"
    }
    full_path += item.name
    if (item.type == "directory") {
        var new_node = document.createElement("li");
        new_node.classList.add(item.type);
        new_node.dataset.path = "/" + full_path;
        var name_holder = document.createElement("span");
        var icon = make_icon("fa-folder"); // TODO: This doesn't keep open state across refreshes...
        name_holder.append(icon);
        name_holder.append(item.name);
        new_node.append(name_holder);

        var list = document.createElement("ul");
        if (item.contents !== undefined) {
            for (var i = 0; i < item.contents.length; i++) {
                var nested_list = getList(item.contents[i], full_path);
                list.append(nested_list);
            }
        }

        new_node.append(list);
        return new_node;
    }

    else {
        var new_node = document.createElement("li");
        new_node.classList.add(item.type);
        new_node.dataset.path = "/" + full_path;
        var name_holder = document.createElement("span");

        if (item.type == "file") {
            var icon = make_icon("fa-file-o");
        } else if (item.type == "link") {
            var icon = make_icon("fa-link");
        } else {
            // unknown item type
            var icon = make_icon("fa-question");
        }
        name_holder.append(icon);

        if (item.type == "link") {
            name_holder.append(item.name + " -> " + item.target);
        } else {
            name_holder.append(item.name);
        }

        new_node.append(name_holder);
        return new_node;
    }

    if (item.type != "file" && item.type != "directory" && item.type != "link") {
        console.log(item, item.type);
    }
}

function build_list(item, full_path) {
    var ul = document.createElement("ul");
    ul.append(getList(item, full_path));

    return ul;
}

function fix_json(json, prefix) {
    json.name = json.name.slice(prefix.length + 1);
    return json;
}

function add_tree_event_handlers(dom_list, tree_anchor_ref, shadow_dom_ref) {
    // continue here
    $(dom_list).find("li span").click(function (e) {
        var li = $(e.target.parentElement);
        if (e.altKey && li.hasClass("tree_fetched")) {
            
            li.toggleClass("selected");
            e.stopImmediatePropagation();
        }
    });
    
    $(dom_list).find(".directory > span").click(function(e) {
        e.stopPropagation();
        var span_elem = e.target
        var parent_li_elem = e.target.parentElement

        // find shadow dom equivalent parent_li_elem
  //      var shadow_li = get_shadow_element(parent_li_elem, shadow_dom_ref.firstChild);
 //       console.log("parent li", parent_li_elem);
//        console.log("shadow li", shadow_li);

        //var shadow_span = $(shadow_li).find("span").first()[0]
        
        // to update shadow dom element (parent_li_elem -> shadow_li)
        toggle_expanded_status(parent_li_elem);
        
        // rerender
        //render_shadow_dom(tree_anchor_ref, shadow_dom_ref);

        
        LAST_CLICKED = span_elem;
        if (may_have_unfetched_subdirs(span_elem) && !SERVER_REQUEST_BUSY) {
            SERVER_REQUEST_BUSY = true;
            fetch_directory_contents(span_elem, tree_anchor_ref, shadow_dom_ref);
            $(parent_li_elem).addClass("tree_fetching");
        }

    });
    $(dom_list).find(".file span").click(function(e) {
        e.stopPropagation();
        console.log("file clicked", e.target.parentElement);
        // Open file
        cat_file_contents(e.target.parentElement.dataset.path);
        
        LAST_CLICKED = e.target;

    });
    $(dom_list).find(".link span").click(function(e) {
        e.stopPropagation();
        console.log("link clicked", e.target.parentElement);
        LAST_CLICKED = e.target;
    });

    return dom_list;
}

function may_have_unfetched_subdirs(span_elem) {
    if ($(span_elem.parentElement).hasClass("directory")) {
        var result = !$(span_elem.parentElement).hasClass("tree_fetched") && span_elem.parentElement.dataset.path != "/peek" && span_elem.parentElement.parentElement.parentElement.dataset.path == "/peek"
        return result;
        //return span_elem.nextSibling.childElementCount == 0;
    } else {
        console.log("non-dir tested for unfetched subdirs")
        return false;
    }
}

function fetch_directory_contents(directory_span_elem, tree_anchor_ref, shadow_dom_ref) {
    var dir_elem_path = get_path_from_elem(directory_span_elem)
    
    print("About to request path", dir_elem_path);
    if (list_contains_substring(SERVICE_BLACKLIST, dir_elem_path)) {
        alert("This one's on the blacklist - sorry");
        SERVER_REQUEST_BUSY = false;
    } else {
        $(directory_span_elem).toggleClass("tree_fetching");
        console.log("About to fetch!");
        send_request("tree", {"path": dir_elem_path}, function (res) {
            var obj = JSON.parse(res)[0]
            var li_parent = directory_span_elem.parentElement;
            var ul_grandparent = li_parent.parentElement;

            // Make new list from response data and replace li
            var start_path = li_parent.parentElement.parentElement.dataset.path
            var full_path = "peek"; // TODO: Fix, since this doesn't work for deeper level dirs right now
            obj = fix_json(obj, start_path);
            var new_list = add_tree_event_handlers(build_list(obj, full_path), tree_anchor_ref, shadow_dom_ref).firstChild;

            // Render to shadowdom instead of real dom

            // trigger rerender

            var refresh_button = make_icon("fa-refresh");
            $(new_list).find("ul").first().before(refresh_button);
            
            // TODO: move this to fix refresh!
            $(refresh_button).click(function(e) {
                // set fetching status
                set_fetch_status(new_list, "tree_fetching");

                // trigger fetch_directory_contents
                fetch_directory_contents($(new_list).find('span').first()[0]);
            });
            
            // TODO: Dirty hack, make sure to copy over all relevant set classes instead
            // (blacklist not whitelist)
            if ($(li_parent).hasClass("selected")) {
                $(new_list).addClass("selected");
            }
            
            ul_grandparent.replaceChild(new_list, li_parent);

            // set new expanded and fetch states
            set_expanded_status(new_list, "expanded");
            set_fetch_status(new_list, "tree_fetched");
            SERVER_REQUEST_BUSY = false;

            // TODO: retrigger filters
            
            
            // Note: if we want shadown dom back, do this
            //render_shadow_dom(tree_anchor_ref, shadow_dom_ref);
        });
    }
}

function get_path_from_elem(elem) {
    console.log(elem.parentElement);
    return elem.parentElement.dataset.path;
}

function get_fetch_status(dir_el) {
    var $el = $(dir_el);
    if ($el.hasClass("tree_fetching")) {
        return "tree_fetching";
    } else if ($el.hasClass("tree_fetched")) {
        return "tree_fetched";
    } else {
        return "tree_unfetched";
    }
}

function set_fetch_status(dir_el, status) {
    var $el = $(dir_el);
    if (status == "tree_fetching") {
        $el.removeClass("tree_fetched").addClass("tree_fetching");
        // Todo: do we need to change icon?
    } else if (status == "tree_fetched") {
        $el.removeClass("tree_fetching").addClass("tree_fetched");
        // Todo: do we need to change icon? 
    } else if (status == "tree_unfetched") {
        console.error("Can't reset a folder back to unfetched state");
    }
}

function get_expanded_status(dir_el) {
    var $el = $(dir_el);
    
    if ($(dir_el).hasClass("expanded")) {
        return "expanded";
    } else if ($(dir_el).hasClass("collapsed")) {
        return "collapsed"
    } else {
        return "collapsed"
    }
}

function set_expanded_status(dir_el, status) {
    var $li = $(dir_el);
    if (status == "expanded") {
        // set li
        $li.removeClass("collapsed").addClass("expanded");
        // Set icon
        $li.find("i").first().removeClass("fa-folder").addClass("fa-folder-open");
    }
    if (status == "collapsed") {
        // set li
        $li.removeClass("expanded").addClass("collapsed");
        // set icon
        console.log($li.find("i").first());
        $li.find("i").first().removeClass("fa-folder-open").addClass("fa-folder");
    }
}

function toggle_expanded_status(dir_el) {
    var status = get_expanded_status(dir_el);
    if (status == "expanded") {
        set_expanded_status(dir_el, "collapsed");
    } else if (status == "collapsed") {
        set_expanded_status(dir_el, "expanded");
    }
}


/* ==================================================
 * Tree modification operations
 * ================================================== 
 */
function get_shadow_element(dom_li, shadow_dom) {
    if (dom_li.tagName !== "LI" || shadow_dom.tagName !== "LI") {
        console.error("only list items supported for retrieval")
    }

    // traverse tree
    if (shadow_dom.dataset.path == dom_li.dataset.path) {
        return shadow_dom;
    } else {
        var $shadow_li = $(shadow_dom);
        var children = $shadow_li.find("ul").first()[0].children;
        var child = null;
        
        var path = dom_li.dataset.path;

        for (var i = 0; i < children.length; i++) {
            child = children[i];

            if (child.classList.contains("directory")
                && path.includes(child.dataset.path)) {
                return get_shadow_element(dom_li, child);
            }            
        }
    }
    return null;
}

function render_shadow_dom(anchor, shadow_dom) {
    if (shadow_dom == "null") {
        console.error("shadow dom is null");
    }
    if (anchor == "nul") {
        console.error("shadow dom is null");
    }
    
    if (anchor.children.length > 0) {
        anchor.removeChild(anchor.children[0]);
    }

    // add event listeners to clone
    var clone = shadow_dom.cloneNode(true);
    add_tree_event_handlers(clone, anchor, shadow_dom);
    
    anchor.appendChild(clone);
}

function tree_recurse(item, filter_callback) {
    // if ul, error
    if (item.tagName == "UL") {
        console.error("please call function with list item");
    }
    
    // iterate over tree leaves. if filter returns true, then call filter on parent of node.
    // depth-first-search

    if (item.classList.contains("directory")) {
        // recurse down
        var children = $(item).find("ul").first()[0].children;
        var results = []
        for (var i = 0; i < children.length; i++) {
            var recur_item = children[i];
            results.push(tree_recurse(recur_item, filter_callback));
        }

        // check if we need to act on this node
        if (results.includes(true)) {
            return filter_callback(item, false);
        } else {
            return false;
        }
        
    } else {
        return filter_callback(item, true);
    }
}


function tree_recurse_leaves(item, filter_callback) {
    tree_recurse(item, function(li_elem, is_leaf) {
        if (is_leaf) {
            filter_callback(li_elem);
        }
        return false;
    });
}

