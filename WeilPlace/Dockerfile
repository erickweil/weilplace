FROM amazoncorretto:18

ARG DEPENDENCY=./app/libs/

ARG JAR_FILE=./app/build/libs/app.jar

EXPOSE 8090

WORKDIR /opt/app

COPY ${DEPENDENCY} libs

COPY ${JAR_FILE} app.jar

ENTRYPOINT [ "java", "-cp", "app.jar:libs/*", "br.erickweil.weilplace.WeilPlace","-file","/opt/app/img/pixels.bmp"]