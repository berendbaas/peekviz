/* Helper functionality for debugging */

var reloadCSS = function() {
  $('#css').replaceWith('<link id="css" rel="stylesheet" href="css/main.css?t=' + Date.now() + '"></link>');
};

print = console.log






///// Throwaway stuff
/*
var LtR_diff = new Set(`msgtable.596669918/1/msg/magic.anon.1
msgtable.596669918/1/msg/magic.anon.1/m_u32
msgtable.596669918/1/msg/magic.anon.1/m_u32/data
.dynamic/252~%OUT_OF_BAND_PARENT~%INITIAL_STACK_AREA~0/.raw
initialized.596669918
msgtable.596669918/.raw
msgtable.596669918/0/.raw
msgtable.596669918/0/dst
msgtable.596669918/0/flags
msgtable.596669918/0/msg/.raw
msgtable.596669918/0/msg/m_type
msgtable.596669918/0/msg/magic.anon.1/.raw
msgtable.596669918/0/msg/magic.anon.1/m_u32/.raw
msgtable.596669918/0/msg/magic.anon.1/m_u32/data/.raw
msgtable.596669918/0/msg/magic.anon.1/m_u32/data/1
msgtable.596669918/376/msg/magic.anon.1/.raw
msgtable.596669918/376/msg/magic.anon.1/m_u32/.raw
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/.raw
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/0
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/1
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/10
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/11
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/12
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/13
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/2
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/3
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/4
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/5
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/6
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/7
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/8
msgtable.596669918/376/msg/magic.anon.1/m_u32/data/9
next_open_devs_slot.1585073713
next_slot.596669918
open_counter.177224805
print_buf.2512002967/.raw
sef_self_init_flags
sef_self_priv_flags`.split(/\r?\n/));

var RtL_diff = new Set(`msgtable.596669918/288/msg/magic.anon.1/m_u32
msgtable.596669918/288/msg/magic.anon.1/m_u32/data
.dynamic/252~%OUT_OF_BAND_PARENT~%INITIAL_STACK_AREA~0/.raw
initialized.596669918
msgtable.596669918/.raw
msgtable.596669918/0/.raw
msgtable.596669918/0/dst
msgtable.596669918/0/flags
msgtable.596669918/0/msg/.raw
msgtable.596669918/0/msg/m_type
msgtable.596669918/0/msg/magic.anon.1/.raw
msgtable.596669918/0/msg/magic.anon.1/m_u32/.raw
msgtable.596669918/0/msg/magic.anon.1/m_u32/data/.raw
msgtable.596669918/0/msg/magic.anon.1/m_u32/data/1
next_open_devs_slot.1585073713
next_slot.596669918
open_counter.177224805
print_buf.2512002967/.raw
sef_self_init_flags
sef_self_priv_flags`.split(/\r?\n/));







var all_diff_entries = Array.from(RtL_diff.union(LtR_diff)).sort()
var strictly_LtR = LtR_diff.difference(RtL_diff);
var strictly_RtL = RtL_diff.difference(LtR_diff);
var both = LtR_diff.intersection(RtL_diff);

var x;
*/
