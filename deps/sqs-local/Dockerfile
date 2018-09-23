FROM java:8

ADD https://s3-eu-west-1.amazonaws.com/softwaremill-public/elasticmq-server-0.13.8.jar /
COPY custom.conf /
ENTRYPOINT ["/usr/bin/java", "-Dconfig.file=custom.conf", "-jar", "/elasticmq-server-0.13.8.jar"]

EXPOSE 9324

CMD ["-help"]
