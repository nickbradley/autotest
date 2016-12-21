FROM node:6.3.0
MAINTAINER Nick Bradley <nbrad11@cs.ubc.ca>

ARG repo_url
ARG commit

COPY pull-repo.sh /pull-repo.sh
COPY tester.sh /tester.sh
RUN chmod +x /pull-repo.sh
RUN chmod +x /tester.sh

RUN /pull-repo.sh $repo_url /deliverable $commit
RUN cd /deliverable && npm run configure


#COPY iptables.sh /iptables.sh
#RUN chmod +x /iptables.sh
#RUN su -c iptables --get-all-rules
#RUN /iptables.sh


ENV MOCHAWESOME_REPORTDIR=/cpsc310project/mocha_output

CMD { /pull-repo.sh $CLIENT_URL /cpsc310project $CLIENT_COMMIT && timeout 5m /tester.sh /cpsc310project /deliverable; } 2>&1
