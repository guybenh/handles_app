import sys

from applicationinsights import TelemetryClient
tc = TelemetryClient('7d30e5cc-6473-4c8c-9f8b-a317caae58ab')
tc.track_event('Test event')
tc.flush()

tc.track_trace('Test trace', { 'foo': 'bar' })
tc.flush()

tc.track_metric('My Metric', 42)
tc.flush()

try:
    raise Exception('blah')
except:
    tc.track_exception()

try:
    raise Exception("blah")
except:
    tc.track_exception(*sys.exc_info(), properties={ 'foo': 'bar' }, measurements={ 'x': 42 })
tc.flush()

print('hello docker')