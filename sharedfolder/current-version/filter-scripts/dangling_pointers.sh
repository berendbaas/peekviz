for f in `find /peek/DEVICEPLACEHOLDER -type l`; do
    link=$(readlink $f)
    echo $f $link
done

get_all_pointers | grep invalid
