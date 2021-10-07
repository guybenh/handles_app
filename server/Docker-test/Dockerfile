FROM python:3.7

COPY . /app
# todo: remove kuzma

WORKDIR /app

RUN pip3 install -r requirements.txt

ENTRYPOINT ["python3"]
CMD ["app.py"]

## expose port 80
#EXPOSE 80
#
##using 2 workers for now. should be 4?
#CMD gunicorn -w 2 -b :80 app:app