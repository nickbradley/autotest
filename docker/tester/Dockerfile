FROM node:6.3.0
MAINTAINER Nick Bradley <nbrad11@cs.ubc.ca>

RUN apt-get update
RUN apt-get -y install iptables

ARG deliverableRepoUrl
ARG deliverableCommit
ARG allowDNS
ARG externalServers


COPY pull-repo.sh /pull-repo.sh
COPY run-tests.sh /run-tests.sh
RUN chmod +x /pull-repo.sh
RUN chmod +x /run-tests.sh


RUN /pull-repo.sh $deliverableRepoUrl $deliverableCommit /deliverable
RUN cd /deliverable && npm run configure


ENV MOCHAWESOME_REPORTDIR=/cpsc310project/mocha_output
ENV ALLOW_DNS=$allowDNS
ENV WHITELISTED_SERVERS=$externalServers

CMD timeout 5m /run-tests.sh $PROJECT_URL $PROJECT_COMMIT 2>&1
