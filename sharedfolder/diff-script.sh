DIR="/home/diff_results"

dirs()
{
  find $1 -path "*.strings" -prune -o -path "*msgtable*" -prune -o -name '*' -type d -print | cut -sd / -f 4- | sort | uniq > $DIR/left_dirs &
  find $2 -path "*.strings" -prune -o -path "*msgtable*" -prune -o -name '*' -type d -print | cut -sd / -f 4- | sort | uniq > $DIR/right_dirs &
  wait
  diff $DIR/left_dirs $DIR/right_dirs > $DIR/dirdifflr
  cat $DIR/dirdifflr | grep "\<" |  cut -f 2 -d" " > $DIR/dirdiffl &
  cat $DIR/dirdifflr | grep "\>" |  cut -f 2 -d" " > $DIR/dirdiffr &
  wait
}


files() {
  find $1 -path "*.strings" -prune -o -path "*msgtable*" -prune -o -name '*' -type f -print | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-) "; md5 -n $stuff; done | sort > $DIR/left_files &
  find $2 -path "*.strings" -prune -o -path "*msgtable*" -prune -o -name '*' -type f -print | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-) "; md5 -n $stuff; done | sort > $DIR/right_files &
  wait

  sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' $DIR/left_files > $DIR/left_files1 &
  sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' $DIR/right_files > $DIR/right_files1 &
  wait

  diff $DIR/left_files1 $DIR/right_files1 > $DIR/filedifflr
  cat $DIR/filedifflr | grep "\<" | sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' |  cut -f 2 -d" " > $DIR/filediffl &
  cat $DIR/filedifflr | grep "\>" | sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' |  cut -f 2 -d" " > $DIR/filediffr &
  wait
}


symlinks () {
  #find $1 -type l | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-)  -> "; readlink "$stuff"; done | sort | uniq > $DIR/left_links
  #ind $2 -type l | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-)  -> "; readlink "$stuff"; done | sort | uniq > $DIR/right_links
  find $1 -path "*.strings" -prune -o -path "*msgtable*" -prune -o -name '*' -type l -print | cut -sd / -f 4- | sort | uniq > $DIR/left_links &
  find $2 -path "*.strings" -prune -o -path "*msgtable*" -prune -o -name '*' -type l -print | cut -sd / -f 4- | sort | uniq > $DIR/right_links &
  wait

  diff $DIR/left_links $DIR/right_links > $DIR/linkdifflr
  cat $DIR/linkdifflr | grep "\<" |  cut -f 2 -d" " > $DIR/linkdiffl &
  cat $DIR/linkdifflr | grep "\>" |  cut -f 2 -d" " > $DIR/linkdiffr &
  wait
}


files $1 $2 &
dirs $1 $2 &
symlinks $1 $2 &

wait

cat $DIR/dirdiffl $DIR/filediffl $DIR/linkdiffl > $DIR/alldiffsl &
cat $DIR/dirdiffr $DIR/filediffr $DIR/linkdiffr > $DIR/alldiffsr &

wait

cat $DIR/alldiffsl
echo "THIS IS THE LTR RTL SEPARATOR"
cat $DIR/alldiffsr

