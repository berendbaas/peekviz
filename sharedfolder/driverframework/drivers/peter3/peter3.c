#include <minix/drivers.h>
#include <minix/chardriver.h>
#include <stdio.h>
#include <stdlib.h>
#include <minix/ds.h>
#include "peter3.h"


char * joke_setup;
char * punch_line;




int memory_leak_mode = 0;
int list_node_next_value = 0;



typedef struct list_node {
  char * some_string;
  int some_val;
  struct list_node * next;
} list_node;

list_node
  * head,
  * tail;

void add_to_list(int some_val) { /* does what name suggests */
  list_node * new_node = (list_node *) malloc(sizeof(list_node));
  new_node->some_val = some_val;
  tail->next = new_node;
  tail = new_node;
}

void pop_from_list(int search_val, int create_memory_leak) {
  list_node * to_be_popped;
  list_node * cur = head;
  while (cur->next != NULL) {
    if ((cur->next)->some_val == search_val) {
      to_be_popped = cur->next;
      cur->next = (cur->next)->next;
      if (create_memory_leak) {
        to_be_popped->some_string = (char *) malloc(strlen(punch_line));
        strcpy(to_be_popped->some_string, punch_line);
      } else {
        free(to_be_popped);
      }
    }
    cur = cur->next;
  }
}

void print_list_vals() {/* Goes through list, printing each node's some_val */
  list_node * cur = head;
  while (cur != NULL) {
    printf("Currently at node %d\n", cur->some_val);
    cur = cur->next;
  }
}

void add_2_then_pop_first() {
  int val_to_be_popped = list_node_next_value;
  add_to_list(list_node_next_value++);
  add_to_list(list_node_next_value++);
  pop_from_list(val_to_be_popped, memory_leak_mode);
}



/*
 * Function prototypes for the hello driver.
 */
static int memleak_demo_open(devminor_t minor, int access, endpoint_t
user_endpt);
static int memleak_demo_close(devminor_t minor);
static ssize_t memleak_demo_read(devminor_t minor, u64_t position, endpoint_t
endpt,
    cp_grant_id_t grant, size_t size, int flags, cdev_id_t id);

/* SEF functions and variables. */
static void sef_local_startup(void);
static int sef_cb_init(int type, sef_init_info_t *info);
static int sef_cb_lu_state_save(int, int);
static int lu_state_restore(void);

/* Entry points to the hello driver. */
static struct chardriver memleak_demo_tab =
{
    .cdr_open  = memleak_demo_open,
    .cdr_close  = memleak_demo_close,
    .cdr_read  = memleak_demo_read,
};

/** State variable to count the number of times the device has been
opened.
 * Note that this is not the regular type of open counter: it never
decreases.
 */
static int open_counter;

static int memleak_demo_open(devminor_t UNUSED(minor), int UNUSED(access),
    endpoint_t UNUSED(user_endpt)) {

    add_2_then_pop_first();

    printf("memleak_demo_open(). Called %d time(s).\n", ++open_counter);
    return OK;
}

static int memleak_demo_close(devminor_t UNUSED(minor)) {
    printf("memleak_demo_close()\n");
    return OK;
}

static ssize_t memleak_demo_read(devminor_t UNUSED(minor), u64_t position, endpoint_t endpt, cp_grant_id_t grant, size_t size, int UNUSED(flags), cdev_id_t UNUSED(id)) {
    u64_t dev_size;
    char *ptr;
    int ret;
    char *buf = HELLO_MESSAGE;



    printf("memleak_demo_read()\n");

    /* This is the total size of our device. */
    dev_size = (u64_t) strlen(buf);

    /* Check for EOF, and possibly limit the read size. */
    if (position >= dev_size) return 0;    /* EOF */
    if (position + size > dev_size)
        size = (size_t)(dev_size - position);  /* limit size */

    /* Copy the requested part to the caller. */
    ptr = buf + (size_t)position;
    if ((ret = sys_safecopyto(endpt, grant, 0, (vir_bytes) ptr, size))
!= OK)
        return ret;

    /* Return the number of bytes read. */
    return size;
}

static int sef_cb_lu_state_save(int UNUSED(state), int UNUSED(flags)) {
/* Save the state. */
    ds_publish_u32("open_counter", open_counter, DSF_OVERWRITE);

    return OK;
}

static int lu_state_restore() {
/* Restore the state. */
    u32_t value;

    ds_retrieve_u32("open_counter", &value);
    ds_delete_u32("open_counter");
    open_counter = (int) value;

    return OK;
}

static void sef_local_startup() {

    /*
     * Register init callbacks. Use the same function for all event
types
     */
    sef_setcb_init_fresh(sef_cb_init);
    sef_setcb_init_lu(sef_cb_init);
    sef_setcb_init_restart(sef_cb_init);

    /*
     * Register live update callbacks.
     */
    sef_setcb_lu_state_save(sef_cb_lu_state_save);

    /* Let SEF perform startup. */
    sef_startup();
}

static int sef_cb_init(int type, sef_init_info_t *UNUSED(info))
{
/* Initialize the hello driver. */
    int do_announce_driver = TRUE;

    open_counter = 0;
    switch(type) {
        case SEF_INIT_FRESH:
            printf("%s", HELLO_MESSAGE);
        break;

        case SEF_INIT_LU:
            /* Restore the state. */
            lu_state_restore();
            do_announce_driver = FALSE;

            printf("%sHey, I'm a new version!\n", HELLO_MESSAGE);
        break;

        case SEF_INIT_RESTART:
            printf("%sHey, I've just been restarted!\n", HELLO_MESSAGE);
        break;
    }

    /* Announce we are up when necessary. */
    if (do_announce_driver) {
        chardriver_announce();
    }

    /* Initialization completed successfully. */
    return OK;
}

int main(void) {
  joke_setup = (char *) malloc(strlen("Hey, did you hear about the new Pirates of the Carribean movie?"));
  strcpy(joke_setup, "Hey, did you hear about the new Pirates of the Carribean movie?");

  punch_line = (char *) malloc(strlen("Yeah, it's rated ARRRRGH\n"));
  strcpy(punch_line, "Yeah, it's rated ARRRRGH\n");

  punch_line = joke_setup;






  head = tail = (list_node *) malloc(sizeof(list_node));
  head->some_val = list_node_next_value++;
  add_to_list(list_node_next_value++);
  add_to_list(list_node_next_value++);
  add_to_list(list_node_next_value++);
  /* List up to now: [0, 1, 2, 3] */
  pop_from_list(2, memory_leak_mode); // memory_leak_mode == 0, so no memory leak so far
  /* List up to now: [0, 1, 3] */



    /*
     * Perform initialization.
     */
    sef_local_startup();

    /*
     * Run the main loop.
     */
    chardriver_task(&memleak_demo_tab);
    return OK;
}
