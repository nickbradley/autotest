FROM node:6.3.0
MAINTAINER Nick Bradley <nbrad11@cs.ubc.ca>

ARG deliverable
ARG testsuiteUrl
ARG testsuiteCommit
ARG allowDNS
ARG externalServers

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb http://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN apt-get update
RUN apt-get -y install iptables
RUN apt-get -y install zip
RUN apt-get -y install yarn
#RUN yarn global add nyc


COPY pull-repo.sh /pull-repo.sh
COPY run-tests.sh /run-tests.sh
RUN chmod +x /pull-repo.sh
RUN chmod +x /run-tests.sh


RUN /pull-repo.sh $testsuiteRepoUrl $testsuiteCommit /testsuite
RUN cd /testsuite && yarn run configure


ENV MOCHAWESOME_REPORTDIR=/cpsc310project/mocha_output
ENV ALLOW_DNS=$allowDNS
ENV WHITELISTED_SERVERS=$externalServers
ENV TESTSUITE_VERSION=$testsuiteCommit
ENV TS=deliverable

CMD timeout 5m /run-tests.sh $PROJECT_URL $PROJECT_COMMIT >/output/stdio.txt 2>&1
