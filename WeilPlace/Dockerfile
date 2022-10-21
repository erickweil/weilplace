FROM amazoncorretto:18

ARG DEPENDENCY=./app/libs/

ARG JAR_FILE=./app/build/libs/app.jar

WORKDIR /opt/app

COPY ${DEPENDENCY} libs

COPY ${JAR_FILE} app.jar

CMD [ "java", "-cp", "app.jar:libs/*", "br.erickweil.weilplace.WeilPlace" ]
