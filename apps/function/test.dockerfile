FROM node:hydrogen

RUN apt update -y && apt install -y iputils-ping iptables net-tools

CMD ["/bin/bash"]
