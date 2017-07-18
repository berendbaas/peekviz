#!/bin/sh


## ASSUMES COMMON PATH PREFIX DIR OF 1
## I.E. sh diff-script.sh /peek/hello and /peek/1.hello

FIND_PRUNING="-path '*.strings' -prune -o -path '*msgtable*' -prune -o -name '*'"

dirs()
{
  find $1 $FIND_PRUNING -type d -print | cut -sd / -f 4- | sort | uniq > /root/left_dirs #&
  find $2 $FIND_PRUNING -type d -print | cut -sd / -f 4- | sort | uniq > /root/right_dirs #&
  #wait
  diff /root/left_dirs /root/right_dirs > /root/dirdifflr
  cat /root/dirdifflr | grep "\<" |  cut -f 2 -d" " > /root/dirdiffl #&
  cat /root/dirdifflr | grep "\>" |  cut -f 2 -d" " > /root/dirdiffr #&
  #wait
}

dirs()
{
  find $1 -path '*.strings' -prune -o -path '*msgtable*' -prune -o -name '*' -type d -print | cut -sd / -f 4- | sort | uniq > /root/left_dirs #&
  find $2 -path '*.strings' -prune -o -path '*msgtable*' -prune -o -name '*' -type d -print | cut -sd / -f 4- | sort | uniq > /root/right_dirs #&
  #wait
  diff /root/left_dirs /root/right_dirs > /root/dirdifflr
  cat /root/dirdifflr | grep "\<" |  cut -f 2 -d" " > /root/dirdiffl #&
  cat /root/dirdifflr | grep "\>" |  cut -f 2 -d" " > /root/dirdiffr #&
  #wait
}

files() {
  find $1 $FIND_PRUNING -type f -print | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-) "; md5 -n $stuff; done | sort > /root/left_files &
  find $2 $FIND_PRUNING -type f -print | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-) "; md5 -n $stuff; done | sort > /root/right_files &
  wait

  sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' /root/left_files > /root/left_files1 &
  sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' /root/right_files > /root/right_files1 &
  wait

  diff /root/left_files1 /root/right_files1 > /root/filedifflr
  cat /root/filedifflr | grep "\<" | sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' |  cut -f 2 -d" " > /root/filediffl &
  cat /root/filedifflr | grep "\>" | sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' |  cut -f 2 -d" " > /root/filediffr &
  wait
}

files() {
  find $1 -path '*.strings' -prune -o -path '*msgtable*' -prune -o -name '*' -type f -print | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-) "; md5 -n $stuff; done | sort > /root/left_files &
  find $2 -path '*.strings' -prune -o -path '*msgtable*' -prune -o -name '*' -type f -print | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-) "; md5 -n $stuff; done | sort > /root/right_files &
  wait

  sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' /root/left_files > /root/left_files1 &
  sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' /root/right_files > /root/right_files1 &
  wait

  diff /root/left_files1 /root/right_files1 > /root/filedifflr
  cat /root/filedifflr | grep "\<" | sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' |  cut -f 2 -d" " > /root/filediffl &
  cat /root/filedifflr | grep "\>" | sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' |  cut -f 2 -d" " > /root/filediffr &
  wait
}

symlinks () {
  #find $1 -type l | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-)  -> "; readlink "$stuff"; done | sort | uniq > /root/left_links
  #ind $2 -type l | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-)  -> "; readlink "$stuff"; done | sort | uniq > /root/right_links
  find $1 $FIND_PRUNING -type l -print | cut -sd / -f 4- | sort | uniq > /root/left_links &
  find $2 $FIND_PRUNING -type l -print | cut -sd / -f 4- | sort | uniq > /root/right_links &
  wait

  diff /root/left_links /root/right_links > /root/linkdifflr
  cat /root/linkdifflr | grep "\<" |  cut -f 2 -d" " > /root/linkdiffl &
  cat /root/linkdifflr | grep "\>" |  cut -f 2 -d" " > /root/linkdiffr &
  wait
}

symlinks () {
  #find $1 -type l | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-)  -> "; readlink "$stuff"; done | sort | uniq > /root/left_links
  #ind $2 -type l | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-)  -> "; readlink "$stuff"; done | sort | uniq > /root/right_links
  find $1 -path '*.strings' -prune -o -path '*msgtable*' -prune -o -name '*' -type l -print | cut -sd / -f 4- | sort | uniq > /root/left_links &
  find $2 -path '*.strings' -prune -o -path '*msgtable*' -prune -o -name '*' -type l -print | cut -sd / -f 4- | sort | uniq > /root/right_links &
  wait

  diff /root/left_links /root/right_links > /root/linkdifflr
  cat /root/linkdifflr | grep "\<" |  cut -f 2 -d" " > /root/linkdiffl &
  cat /root/linkdifflr | grep "\>" |  cut -f 2 -d" " > /root/linkdiffr &
  wait
}


files $1 $2 &
dirs $1 $2 &
symlinks $1 $2 &

wait

echo "LtR d"
cat /root/dirdiffl
echo "LtR f"
cat /root/filediffl
echo "LtR l"
cat /root/linkdiffl

echo "RtL d"
cat /root/dirdiffr
echo "RtL f"
cat /root/filediffr
echo "RtL l"
cat /root/linkdiffr

#cat /root/dirdiffl /root/filediffl /root/linkdiffl > /root/alldiffsl &
#cat /root/dirdiffr /root/filediffr /root/linkdiffr > /root/alldiffsr &

#wait

#cat /root/alldiffsl
#echo "THIS IS THE LTR RTL SEPARATOR"
#cat /root/alldiffsr
