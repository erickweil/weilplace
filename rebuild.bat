docker stop -t=0 weilplace-site
docker stop -t=0 weilplace-api
docker container rm -f weilplace-site
docker container rm -f weilplace-api
docker rmi erickweil/weilplace-site:latest
docker rmi erickweil/weilplace-api:latest


docker build -t erickweil/weilplace-api WeilPlace
docker build -t erickweil/weilplace-site weilplace-site

docker run -d -p 80:80 --name weilplace-site erickweil/weilplace-site
docker run -v /c/git/weilplace/img:/opt/app/img -d -p 8090:8090 --name weilplace-api erickweil/weilplace-api