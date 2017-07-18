# Makefile for the hello driver.
PROG=   mydriver
SRCS=   mydriver.c

#FILES=${PROG}.conf
#FILESNAME=${PROG}
#FILESDIR= /etc/system.conf.d

DPADD+= ${LIBCHARDRIVER} ${LIBSYS}
LDADD+= -lchardriver -lsys

#MAN=

.include <minix.service.mk>
